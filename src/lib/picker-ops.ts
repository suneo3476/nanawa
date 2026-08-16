/**
 * 選曲ノートの共有状態と、それを変更する操作(op)。
 *
 * このファイルは **クライアントと Cloudflare Worker の両方から読まれる**。
 * 同じ applyOp を使うことで、
 *   - クライアント: 押した瞬間に楽観的に適用(体感を速くする)
 *   - Durable Object: 唯一の書き手として確定させる
 * の2つが必ず同じ結果に収束する。
 *
 * クライアントは「操作」だけを送り、状態を丸ごと送らない。
 * これにより複数人が同時に触っても誰かの変更が消えない。
 */

export interface DraftItem {
  songId: string;
  confirmed: boolean;
}

export interface Member {
  id: string;
  name: string;
  wishes: string[];
}

export interface Draft {
  id: string;
  eventName: string;
  date: string;
  venueName: string;
  memo: string;
  items: DraftItem[];
  members: Member[];
  tempoDir: string;
  fameDir: string;
}

export interface Store {
  drafts: Draft[];
  currentId: string;
  seq: number;
}

export const EMPTY_STORE: Store = { drafts: [], currentId: "", seq: 0 };

export type PickerOp =
  | { type: "draft.create"; members?: Member[] }
  | { type: "draft.delete"; draftId: string }
  | { type: "draft.select"; draftId: string }
  | { type: "draft.meta"; draftId: string; patch: Partial<Draft> }
  | { type: "item.add"; draftId: string; songId: string }
  | { type: "item.remove"; draftId: string; songId: string }
  | { type: "item.confirm"; draftId: string; songId: string; confirmed: boolean }
  | { type: "item.move"; draftId: string; songId: string; to: number }
  | { type: "item.replaceAll"; draftId: string; items: DraftItem[] }
  | { type: "member.add"; draftId: string; memberId: string; name?: string }
  | { type: "member.remove"; draftId: string; memberId: string }
  | { type: "member.rename"; draftId: string; memberId: string; name: string }
  | { type: "members.replace"; draftId: string; members: Member[] }
  | { type: "wish.add"; draftId: string; memberId: string; songId: string }
  | { type: "wish.remove"; draftId: string; memberId: string; songId: string }
  | { type: "store.seed"; store: Store };

/**
 * ユニオン型のまま各要素から draftId を外す。
 * 素の Omit<PickerOp, "draftId"> はユニオンを潰して共通キーだけにしてしまい、
 * songId など op 固有のキーが消えてしまう。
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/** 呼び出し側が draftId を省略できる形の op(省略時は現在のセトリに適用する) */
export type PickerOpInput = DistributiveOmit<PickerOp, "draftId"> & {
  draftId?: string;
};

const DEFAULT_MEMBER_COUNT = 7;

export function newDraft(seq: number, members: Member[] = []): Draft {
  return {
    id: `draft-${seq}`,
    eventName: "",
    date: "",
    venueName: "",
    memo: "",
    items: [],
    members:
      members.length > 0
        ? members.map((m) => ({ ...m, wishes: [...m.wishes] }))
        : Array.from({ length: DEFAULT_MEMBER_COUNT }, (_, i) => ({
            id: `m${i + 1}`,
            name: `メンバー${i + 1}`,
            wishes: [],
          })),
    tempoDir: "none",
    fameDir: "none",
  };
}

/**
 * draft を1つだけ差し替えた新しい Store を返す。
 *
 * fn が同じ参照を返した(= 何も変わらなかった)場合は store をそのまま返す。
 * これで呼び出し側が `next === store` で「変化なし」を判定でき、
 * 意味のない broadcast で全員の端末を起こさずに済む。
 */
function mapDraft(store: Store, draftId: string, fn: (d: Draft) => Draft): Store {
  const idx = store.drafts.findIndex((d) => d.id === draftId);
  if (idx < 0) return store;
  const next = fn(store.drafts[idx]);
  if (next === store.drafts[idx]) return store;
  const drafts = [...store.drafts];
  drafts[idx] = next;
  return { ...store, drafts };
}

/** 同上。変化がなければ draft をそのまま返す */
function mapMember(
  draft: Draft,
  memberId: string,
  fn: (m: Member) => Member,
): Draft {
  const idx = draft.members.findIndex((m) => m.id === memberId);
  if (idx < 0) return draft;
  const next = fn(draft.members[idx]);
  if (next === draft.members[idx]) return draft;
  const members = [...draft.members];
  members[idx] = next;
  return { ...draft, members };
}

const META_KEYS = [
  "eventName",
  "date",
  "venueName",
  "memo",
  "tempoDir",
  "fameDir",
] as const;

/**
 * op を適用して新しい Store を返す。
 * 何も変わらない op は元の store をそのまま返す(参照で判定できる)。
 */
export function applyOp(store: Store, op: PickerOp): Store {
  switch (op?.type) {
    // ---- セトリ案そのもの ----
    case "draft.create": {
      const seq = store.seq + 1;
      const draft = newDraft(seq, op.members ?? []);
      return { drafts: [...store.drafts, draft], currentId: draft.id, seq };
    }
    case "draft.delete": {
      const drafts = store.drafts.filter((d) => d.id !== op.draftId);
      if (drafts.length === store.drafts.length) return store;
      const currentId =
        store.currentId === op.draftId ? (drafts[0]?.id ?? "") : store.currentId;
      return { ...store, drafts, currentId };
    }
    case "draft.select":
      if (store.currentId === op.draftId) return store;
      return store.drafts.some((d) => d.id === op.draftId)
        ? { ...store, currentId: op.draftId }
        : store;
    case "draft.meta":
      return mapDraft(store, op.draftId, (d) => {
        const patch: Partial<Draft> = {};
        for (const k of META_KEYS) {
          if (op.patch && k in op.patch && op.patch[k] !== d[k]) {
            patch[k] = op.patch[k];
          }
        }
        return Object.keys(patch).length === 0 ? d : { ...d, ...patch };
      });

    // ---- セトリの曲 ----
    case "item.add":
      return mapDraft(store, op.draftId, (d) =>
        d.items.some((i) => i.songId === op.songId)
          ? d
          : { ...d, items: [...d.items, { songId: op.songId, confirmed: false }] },
      );
    case "item.remove":
      return mapDraft(store, op.draftId, (d) => {
        const items = d.items.filter((i) => i.songId !== op.songId);
        return items.length === d.items.length ? d : { ...d, items };
      });
    case "item.confirm":
      return mapDraft(store, op.draftId, (d) => {
        const idx = d.items.findIndex((i) => i.songId === op.songId);
        if (idx < 0 || d.items[idx].confirmed === !!op.confirmed) return d;
        const items = [...d.items];
        items[idx] = { ...items[idx], confirmed: !!op.confirmed };
        return { ...d, items };
      });
    case "item.move":
      return mapDraft(store, op.draftId, (d) => {
        const from = d.items.findIndex((i) => i.songId === op.songId);
        if (from < 0) return d;
        const to = Math.max(0, Math.min(d.items.length - 1, op.to | 0));
        if (from === to) return d;
        const items = [...d.items];
        const [moved] = items.splice(from, 1);
        items.splice(to, 0, moved);
        return { ...d, items };
      });
    case "item.replaceAll":
      return mapDraft(store, op.draftId, (d) => {
        const items = (op.items ?? []).map((i) => ({
          songId: i.songId,
          confirmed: !!i.confirmed,
        }));
        const same =
          items.length === d.items.length &&
          items.every(
            (i, n) =>
              i.songId === d.items[n].songId &&
              i.confirmed === d.items[n].confirmed,
          );
        return same ? d : { ...d, items };
      });

    // ---- メンバーと希望曲 ----
    case "member.add":
      return mapDraft(store, op.draftId, (d) =>
        d.members.some((m) => m.id === op.memberId)
          ? d
          : {
              ...d,
              members: [
                ...d.members,
                {
                  id: op.memberId,
                  name: op.name ?? `メンバー${d.members.length + 1}`,
                  wishes: [],
                },
              ],
            },
      );
    case "member.remove":
      return mapDraft(store, op.draftId, (d) => {
        const members = d.members.filter((m) => m.id !== op.memberId);
        return members.length === d.members.length ? d : { ...d, members };
      });
    case "member.rename":
      return mapDraft(store, op.draftId, (d) =>
        mapMember(d, op.memberId, (m) =>
          m.name === op.name ? m : { ...m, name: String(op.name ?? "") },
        ),
      );
    case "members.replace":
      return mapDraft(store, op.draftId, (d) => ({
        ...d,
        members: (op.members ?? []).map((m) => ({
          id: m.id,
          name: m.name,
          wishes: [...m.wishes],
        })),
      }));
    case "wish.add":
      return mapDraft(store, op.draftId, (d) =>
        mapMember(d, op.memberId, (m) =>
          m.wishes.includes(op.songId)
            ? m
            : { ...m, wishes: [...m.wishes, op.songId] },
        ),
      );
    case "wish.remove":
      return mapDraft(store, op.draftId, (d) =>
        mapMember(d, op.memberId, (m) => {
          const wishes = m.wishes.filter((s) => s !== op.songId);
          return wishes.length === m.wishes.length ? m : { ...m, wishes };
        }),
      );

    // ---- localStorage からの初回移行 ----
    case "store.seed":
      // サーバがまだ空のときだけ受け付ける。既にデータがあれば無視する
      // (2人目が開いたときに自分のローカル状態で上書きしてしまうのを防ぐ)
      if (store.drafts.length > 0) return store;
      if (!op.store?.drafts?.length) return store;
      return {
        drafts: op.store.drafts,
        currentId: op.store.currentId ?? "",
        seq: op.store.seq ?? 0,
      };

    default:
      return store;
  }
}

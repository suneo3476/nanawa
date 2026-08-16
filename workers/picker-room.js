/**
 * 選曲ノートの共有状態を持つ Durable Object。
 *
 * 設計: クライアントは「操作(op)」だけを送る。状態を丸ごと送らせない。
 * DO が唯一の書き手として op を順に適用し、確定した状態を全員に配る。
 * DO はシングルスレッドなので op は自然に直列化され、
 * 「7人が同時に触ると誰かの変更が消える」が原理的に起きない。
 *
 * 状態(Store)の形は src/components/picker/types.ts の Draft / Member と揃えてある。
 */

import { DurableObject } from "cloudflare:workers";

/** localStorage 版と同じ初期値 */
const EMPTY_STORE = { drafts: [], currentId: "", seq: 0 };

const DEFAULT_MEMBER_COUNT = 7;

function newDraft(seq) {
  return {
    id: `draft-${seq}`,
    eventName: "",
    date: "",
    venueName: "",
    memo: "",
    items: [],
    members: Array.from({ length: DEFAULT_MEMBER_COUNT }, (_, i) => ({
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
function mapDraft(store, draftId, fn) {
  const idx = store.drafts.findIndex((d) => d.id === draftId);
  if (idx < 0) return store;
  const next = fn(store.drafts[idx]);
  if (next === store.drafts[idx]) return store;
  const drafts = [...store.drafts];
  drafts[idx] = next;
  return { ...store, drafts };
}

/** 同上。変化がなければ draft をそのまま返す */
function mapMember(draft, memberId, fn) {
  const idx = draft.members.findIndex((m) => m.id === memberId);
  if (idx < 0) return draft;
  const next = fn(draft.members[idx]);
  if (next === draft.members[idx]) return draft;
  const members = [...draft.members];
  members[idx] = next;
  return { ...draft, members };
}

/**
 * op を適用して新しい Store を返す。未知の op は状態を変えない。
 * ここは純関数にしてある(テストしやすさと、適用順の見通しのため)。
 */
export function applyOp(store, op) {
  switch (op?.type) {
    // ---- セトリ案そのもの ----
    case "draft.create": {
      const seq = store.seq + 1;
      const draft = newDraft(seq);
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
      return store.drafts.some((d) => d.id === op.draftId)
        ? { ...store, currentId: op.draftId }
        : store;
    case "draft.meta": {
      // eventName / date / venueName / memo / tempoDir / fameDir の部分更新
      const ALLOWED = [
        "eventName",
        "date",
        "venueName",
        "memo",
        "tempoDir",
        "fameDir",
      ];
      return mapDraft(store, op.draftId, (d) => {
        const patch = {};
        for (const k of ALLOWED) {
          if (op.patch && k in op.patch && op.patch[k] !== d[k]) {
            patch[k] = op.patch[k];
          }
        }
        return Object.keys(patch).length === 0 ? d : { ...d, ...patch };
      });
    }

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
    case "item.move": {
      // op.songId を op.to 番目へ動かす
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
    }
    case "item.replaceAll":
      // 「セトリ案の提案」を丸ごと採用するときだけ使う
      return mapDraft(store, op.draftId, (d) => ({
        ...d,
        items: (op.items ?? []).map((i) => ({
          songId: i.songId,
          confirmed: !!i.confirmed,
        })),
      }));

    // ---- メンバーと希望曲 ----
    case "member.add":
      return mapDraft(store, op.draftId, (d) => ({
        ...d,
        members: [
          ...d.members,
          {
            id: op.memberId || `m${d.members.length + 1}`,
            name: op.name ?? `メンバー${d.members.length + 1}`,
            wishes: [],
          },
        ],
      }));
    case "member.remove":
      return mapDraft(store, op.draftId, (d) => {
        const members = d.members.filter((m) => m.id !== op.memberId);
        return members.length === d.members.length ? d : { ...d, members };
      });
    case "member.rename":
      return mapDraft(store, op.draftId, (d) =>
        mapMember(d, op.memberId, (m) =>
          m.name === String(op.name ?? "") ? m : { ...m, name: String(op.name ?? "") },
        ),
      );
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
      return {
        drafts: op.store?.drafts ?? [],
        currentId: op.store?.currentId ?? "",
        seq: op.store?.seq ?? 0,
      };

    default:
      return store;
  }
}

export class PickerRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.store = EMPTY_STORE;
    // hibernation から復帰するとコンストラクタが再実行されるので、
    // 最初のイベントを捌く前に必ず状態を読み直す
    ctx.blockConcurrencyWhile(async () => {
      this.store = (await ctx.storage.get("store")) ?? EMPTY_STORE;
      this.version = (await ctx.storage.get("version")) ?? 0;
    });
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      // WebSocket が使えない環境向けのフォールバック(現在の状態を返すだけ)
      return Response.json({ version: this.version, store: this.store });
    }

    const [client, server] = Object.values(new WebSocketPair());
    // acceptWebSocket を使うと hibernation の対象になり、
    // 誰も操作していない間は課金されない
    this.ctx.acceptWebSocket(server);
    server.send(
      JSON.stringify({ type: "sync", version: this.version, store: this.store }),
    );

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, raw) {
    let msg;
    try {
      msg = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw));
    } catch {
      return;
    }

    if (msg.type === "ping") {
      ws.send(JSON.stringify({ type: "pong" }));
      return;
    }
    if (msg.type !== "op") return;

    const next = applyOp(this.store, msg.op);
    if (next === this.store) return; // 状態が変わらない op は配らない

    this.store = next;
    this.version += 1;
    await this.ctx.storage.put("store", this.store);
    await this.ctx.storage.put("version", this.version);

    this.broadcast({
      type: "sync",
      version: this.version,
      store: this.store,
      opType: msg.op.type,
    });
  }

  async webSocketClose(ws, code, reason) {
    // 1005 (No Status Received) をそのまま返すとエラーになるので潰す
    ws.close(code === 1005 ? 1000 : code, reason);
  }

  async webSocketError(ws) {
    try {
      ws.close(1011, "internal error");
    } catch {
      // 既に閉じている
    }
  }

  broadcast(obj) {
    const payload = JSON.stringify(obj);
    for (const peer of this.ctx.getWebSockets()) {
      try {
        peer.send(payload);
      } catch {
        // 切断済みのソケットは無視する
      }
    }
  }
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Tempo } from "@/lib/types";
import {
  combinedFit,
  directionAffinity,
  emptyComposition,
  FAME_DIRS,
  fameFit,
  TEMPO_DIRS,
  tempoFit,
  wishFit,
  type Composition,
  type FameDirKey,
  type TempoDirKey,
} from "@/lib/scoring";
import { formatDateShort } from "@/lib/format";
import { TEMPO_BORDER, TEMPO_LABEL } from "@/components/SongBadges";
import { Chip, PoolPanel, type SortKey } from "./PoolPanel";
import {
  emptyFilter,
  filterSongs,
  isFilterActive,
  type FilterState,
} from "./filter";
import { DirectionMatrix } from "./DirectionMatrix";
import { MembersPanel } from "./MembersPanel";
import { LiveInfoCard } from "./LiveInfoCard";
import { SetlistExport } from "./SetlistExport";
import { SuggestPanel } from "./SuggestPanel";
import { suggestSetlists, type Suggestion } from "@/lib/suggest";
import {
  checkLocalApi,
  loadGithubConfig,
  saveMembersViaGithub,
  saveMembersViaLocal,
  saveSongAttrsViaGithub,
  saveSongAttrsViaLocal,
  type SongAttrEdit,
} from "@/lib/setlist-backend";
import type { Draft, Member, PickerAlbum, PickerSong } from "./types";

const STORAGE_KEY = "nanawa-picker-v2";
const LEGACY_KEY = "nanawa-picker-v1";
const DEFAULT_MEMBER_COUNT = 7;

function defaultMembers(saved: Member[]): Member[] {
  if (saved.length > 0) return saved.map((m) => ({ ...m, wishes: [...m.wishes] }));
  return Array.from({ length: DEFAULT_MEMBER_COUNT }, (_, i) => ({
    id: `m${i + 1}`,
    name: `メンバー${i + 1}`,
    wishes: [],
  }));
}

function newDraft(seq: number, saved: Member[] = []): Draft {
  return {
    id: `draft-${seq}`,
    eventName: "",
    date: "",
    venueName: "",
    memo: "",
    items: [],
    members: defaultMembers(saved),
    tempoDir: "none",
    fameDir: "none",
  };
}

interface Store {
  drafts: Draft[];
  currentId: string;
  seq: number;
}

export function SetlistPlanner({
  songs: rawSongs,
  albums,
  members: savedMembers,
  nextLiveNumber,
  nextEventId,
}: {
  songs: PickerSong[];
  albums: PickerAlbum[];
  /** data/members.yml のメンバーと希望曲(新規セトリの初期値) */
  members: Member[];
  nextLiveNumber: number;
  nextEventId: number;
}) {
  const [store, setStore] = useState<Store>(() => ({
    drafts: [newDraft(1, savedMembers)],
    currentId: "draft-1",
    seq: 1,
  }));
  const [memberSaveState, setMemberSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [loaded, setLoaded] = useState(false);
  const [urlList, setUrlList] = useState<string[] | null>(null);
  const [copied, setCopied] = useState<"" | "link" | "text">("");
  const [poolModalOpen, setPoolModalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [wishMemberId, setWishMemberId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [suggestSize, setSuggestSize] = useState(6);
  // 曲の絞り込みは曲プールと提案で共有する(モバイルのモーダルとPCで同じ状態になる)
  const [filter, setFilter] = useState<FilterState>(emptyFilter);
  const [tool, setTool] = useState<"direction" | "suggest" | "members">(
    "direction",
  );
  // テンポ/バラードの直し(保存するまでは画面上だけに反映する)
  const [tempoEdits, setTempoEdits] = useState<Map<string, SongAttrEdit>>(
    new Map(),
  );
  const [attrSaveState, setAttrSaveState] = useState<
    "idle" | "saving" | "error"
  >("idle");
  const [sort, setSort] = useState<SortKey>("gap");

  /** 未保存の直しを反映した曲リスト */
  const songs = useMemo(() => {
    if (tempoEdits.size === 0) return rawSongs;
    return rawSongs.map((s) => {
      const edit = tempoEdits.get(s.id);
      return edit ? { ...s, tempo: edit.tempo, ballad: edit.ballad } : s;
    });
  }, [rawSongs, tempoEdits]);

  const songById = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);
  const draft =
    store.drafts.find((d) => d.id === store.currentId) ?? store.drafts[0];

  // ---- 保存/復元 ----
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Store;
        if (parsed?.drafts?.length) {
          // eslint-disable-next-line react-hooks/set-state-in-effect -- 外部ストア(localStorage)からの初期化
          setStore(parsed);
        }
      } else {
        // v1(単なる songId 配列)からの移行
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          const ids = (JSON.parse(legacy) as string[]).filter((id) =>
            songById.has(id),
          );
          if (ids.length) {
            const d = newDraft(1, savedMembers);
            d.items = ids.map((songId) => ({ songId, confirmed: false }));
             
            setStore({ drafts: [d], currentId: d.id, seq: 1 });
          }
        }
      }
    } catch {
      // 壊れた保存データは無視して新規から始める
    }
    const param = new URLSearchParams(window.location.search).get("list");
    if (param) {
      const ids = param.split(",").filter((id) => songById.has(id));
       
      if (ids.length > 0) setUrlList(ids);
    }
     
    setLoaded(true);
    // savedMembers は初回の下書き作成にしか使わないので、依存に入れて
    // 読み直しが走らないようにする(入れると保存のたびに復元されてしまう)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songById]);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // 保存できなくても致命的ではない
    }
  }, [store, loaded]);

  // 別のタブで更新されたら取り込む(古いタブが新しい内容を上書きするのを防ぐ)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue) as Store;
        if (parsed?.drafts?.length) setStore(parsed);
      } catch {
        // 壊れた値は無視
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!poolModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPoolModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [poolModalOpen]);

  // ---- draft 更新ヘルパ ----
  const updateDraft = useCallback(
    (fn: (d: Draft) => Draft) => {
      setStore((s) => ({
        ...s,
        drafts: s.drafts.map((d) => (d.id === s.currentId ? fn(d) : d)),
      }));
    },
    [],
  );

  const pickedIds = useMemo(
    () => new Set(draft.items.map((i) => i.songId)),
    [draft.items],
  );

  const toggleSong = useCallback(
    (songId: string) =>
      updateDraft((d) =>
        d.items.some((i) => i.songId === songId)
          ? { ...d, items: d.items.filter((i) => i.songId !== songId) }
          : { ...d, items: [...d.items, { songId, confirmed: false }] },
      ),
    [updateDraft],
  );

  const toggleConfirmed = (songId: string) =>
    updateDraft((d) => ({
      ...d,
      items: d.items.map((i) =>
        i.songId === songId ? { ...i, confirmed: !i.confirmed } : i,
      ),
    }));

  const move = (index: number, dir: -1 | 1) =>
    updateDraft((d) => {
      const items = [...d.items];
      const j = index + dir;
      if (j < 0 || j >= items.length) return d;
      [items[index], items[j]] = [items[j], items[index]];
      return { ...d, items };
    });

  const toggleWish = useCallback(
    (songId: string) => {
      if (!wishMemberId) return;
      updateDraft((d) => ({
        ...d,
        members: d.members.map((m) =>
          m.id === wishMemberId
            ? {
                ...m,
                wishes: m.wishes.includes(songId)
                  ? m.wishes.filter((w) => w !== songId)
                  : [...m.wishes, songId],
              }
            : m,
        ),
      }));
    },
    [wishMemberId, updateDraft],
  );

  // ---- 構成とスコア ----
  const composition = useMemo<Composition>(() => {
    const comp = emptyComposition();
    for (const item of draft.items) {
      const s = songById.get(item.songId);
      if (!s) continue;
      if (s.tempo) comp.counts[s.tempo]++;
      else comp.tempoUnknown++;
      if (s.ballad) comp.ballads++;
      if (s.fameTier <= 2) comp.famous++;
      comp.total++;
    }
    return comp;
  }, [draft.items, songById]);

  const tempoDir = draft.tempoDir as TempoDirKey;
  const fameDir = draft.fameDir as FameDirKey;
  const tempoTarget = TEMPO_DIRS.find((d) => d.key === tempoDir)?.target ?? null;
  const fameTarget = FAME_DIRS.find((d) => d.key === fameDir)?.target ?? null;
  const hasDirection = tempoTarget !== null || fameTarget !== null;
  const currentFit = combinedFit(composition, tempoTarget, fameTarget);
  const fitParts = {
    tempo: tempoTarget ? tempoFit(composition.counts, tempoTarget) : null,
    fame:
      fameTarget !== null
        ? fameFit(composition.famous, composition.total, fameTarget)
        : null,
  };
  const wishScore = wishFit(draft.members, pickedIds);

  /** 希望が未充足のメンバーが望んでいる曲か */
  const unsatisfiedWishes = useMemo(() => {
    const set = new Set<string>();
    for (const m of draft.members) {
      if (m.wishes.length === 0) continue;
      if (m.wishes.some((w) => pickedIds.has(w))) continue;
      for (const w of m.wishes) set.add(w);
    }
    return set;
  }, [draft.members, pickedIds]);

  const wishesBySong = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const m of draft.members) {
      for (const w of m.wishes) {
        map.set(w, [...(map.get(w) ?? []), m.name]);
      }
    }
    return map;
  }, [draft.members]);

  /** 絞り込み後の曲。曲プールの表示とセトリ案の母集団の両方に使う */
  const filteredSongs = useMemo(
    () =>
      filterSongs(songs, filter, {
        wishesBySong,
        unmetWishes: unsatisfiedWishes,
      }),
    [songs, filter, wishesBySong, unsatisfiedWishes],
  );

  /** この曲を足したら適合度が何点変わるか(表示用・整数) */
  const fitDelta = useMemo(() => {
    if (!hasDirection) return null;
    const base = combinedFit(composition, tempoTarget, fameTarget) ?? 0;
    return (song: PickerSong) => {
      const next: Composition = {
        counts: { ...composition.counts },
        tempoUnknown: composition.tempoUnknown,
        ballads: composition.ballads,
        famous: composition.famous + (song.fameTier <= 2 ? 1 : 0),
        total: composition.total + 1,
      };
      if (song.tempo) next.counts[song.tempo]++;
      else next.tempoUnknown++;
      return Math.round((combinedFit(next, tempoTarget, fameTarget) ?? 0) - base);
    };
  }, [composition, tempoTarget, fameTarget, hasDirection]);

  /**
   * 「おすすめ順」の並べ替えに使うスコア。
   * 適合度の伸び(小数のまま)＋方向性そのものへの近さ＋未充足メンバーの希望。
   * 整数に丸めると同点だらけになって、どのマスを選んでも同じ並びに見えるため
   * ここでは丸めない。
   */
  const sortScore = useMemo(() => {
    if (!hasDirection && unsatisfiedWishes.size === 0) return null;
    const base = combinedFit(composition, tempoTarget, fameTarget) ?? 0;
    return (song: PickerSong) => {
      let score = 0;
      if (hasDirection) {
        const next: Composition = {
          counts: { ...composition.counts },
          tempoUnknown: composition.tempoUnknown,
          ballads: composition.ballads,
          famous: composition.famous + (song.fameTier <= 2 ? 1 : 0),
          total: composition.total + 1,
        };
        if (song.tempo) next.counts[song.tempo]++;
        else next.tempoUnknown++;
        score += (combinedFit(next, tempoTarget, fameTarget) ?? 0) - base;
        const affinity = directionAffinity(song, tempoTarget, fameTarget);
        if (affinity !== null) score += affinity * 0.25;
      }
      if (unsatisfiedWishes.has(song.id) && !pickedIds.has(song.id)) score += 20;
      return score;
    };
  }, [
    composition,
    tempoTarget,
    fameTarget,
    hasDirection,
    unsatisfiedWishes,
    pickedIds,
  ]);

  // ---- 共有 ----
  const shareUrl = () => {
    const url = new URL(window.location.href);
    url.search =
      draft.items.length > 0
        ? `?list=${draft.items.map((i) => i.songId).join(",")}`
        : "";
    return url.toString();
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl());
    setCopied("link");
    setTimeout(() => setCopied(""), 2000);
  };

  const copyText = async () => {
    const lines = draft.items.map((item, i) => {
      const s = songById.get(item.songId)!;
      const tempo = s.tempo ? `/${TEMPO_LABEL[s.tempo]}` : "";
      const hist = s.performed
        ? `通算${s.playCount}回・最終 ${formatDateShort(s.lastDate)}`
        : "未演奏!";
      return `${i + 1}. ${s.title}${item.confirmed ? " [確定]" : ""}(${hist}${tempo})`;
    });
    const c = composition.counts;
    const header = [
      `🎵 七輪 セトリ案${draft.eventName ? ` — ${draft.eventName}` : ""}`,
      draft.date || draft.venueName
        ? `${draft.date}${draft.venueName ? ` @ ${draft.venueName}` : ""}`
        : "",
    ].filter(Boolean);
    const footer = [
      `構成: アップ${c.up} / ミドル${c.mid} / スロー${c.slow}${
        composition.tempoUnknown ? ` / 不明${composition.tempoUnknown}` : ""
      } ・ 有名曲${composition.famous}/${composition.total}`,
      currentFit !== null
        ? `適合度: ${currentFit}点${
            fitParts.tempo !== null && fitParts.fame !== null
              ? ` (テンポ${Math.round(fitParts.tempo)} / 知名度${Math.round(fitParts.fame)})`
              : ""
          }`
        : "",
      wishScore !== null ? `メンバー希望の充足: ${wishScore}%` : "",
    ].filter(Boolean);
    await navigator.clipboard.writeText(
      [...header, "", ...lines, "", ...footer, "", shareUrl()].join("\n"),
    );
    setCopied("text");
    setTimeout(() => setCopied(""), 2000);
  };

  const openPool = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      document
        .getElementById("song-pool")
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    } else {
      setPoolModalOpen(true);
    }
  };

  const wishMember = draft.members.find((m) => m.id === wishMemberId) ?? null;

  const saveMembers = async () => {
    setMemberSaveState("saving");
    const payload = draft.members.map((m) => ({
      id: m.id,
      name: m.name,
      wishes: m.wishes,
    }));
    try {
      const local = await checkLocalApi();
      if (local) {
        await saveMembersViaLocal(payload);
      } else {
        const cfg = loadGithubConfig();
        if (!cfg) {
          throw new Error(
            "保存先がありません。npm run dev で起動するか、書き出し画面でGitHubを設定してください。",
          );
        }
        await saveMembersViaGithub(cfg, payload, (id) => songById.get(id)?.title);
      }
      setMemberSaveState("saved");
      setTimeout(() => setMemberSaveState("idle"), 2500);
    } catch (e) {
      console.error(e);
      setMemberSaveState("error");
      setTimeout(() => setMemberSaveState("idle"), 3500);
    }
  };

  /** data/members.yml の内容を今のセトリに読み直す */
  const reloadMembers = () => {
    if (savedMembers.length === 0) return;
    updateDraft((d) => ({ ...d, members: defaultMembers(savedMembers) }));
  };

  const editTempo = (
    songId: string,
    next: { tempo: SongAttrEdit["tempo"]; ballad: boolean },
  ) => {
    setTempoEdits((prev) => {
      const nextMap = new Map(prev);
      nextMap.set(songId, { songId, ...next });
      return nextMap;
    });
  };

  const saveTempoEdits = async () => {
    if (tempoEdits.size === 0) return;
    setAttrSaveState("saving");
    const edits = [...tempoEdits.values()];
    try {
      const local = await checkLocalApi();
      if (local) {
        await saveSongAttrsViaLocal(edits);
      } else {
        const cfg = loadGithubConfig();
        if (!cfg) {
          throw new Error(
            "保存先がありません。npm run dev で起動するか、書き出し画面でGitHubを設定してください。",
          );
        }
        await saveSongAttrsViaGithub(cfg, edits, (id) => songById.get(id)?.title);
      }
      setTempoEdits(new Map());
      setAttrSaveState("idle");
    } catch (e) {
      console.error(e);
      setAttrSaveState("error");
      setTimeout(() => setAttrSaveState("idle"), 3500);
    }
  };

  const generateSuggestions = () => {
    const lockedIds = draft.items.filter((i) => i.confirmed).map((i) => i.songId);
    // 提案の母集団は「いま絞り込んでいる曲」。ただし確定済みの曲は
    // 絞り込みから外れていても必ず対象に含める。
    const pool = new Map(filteredSongs.map(({ song }) => [song.id, song]));
    for (const id of lockedIds) {
      const song = songById.get(id);
      if (song) pool.set(id, song);
    }
    setSuggestions(
      suggestSetlists({
        songs: [...pool.values()].map((s) => ({
          id: s.id,
          title: s.title,
          tempo: s.tempo,
          fameTier: s.fameTier,
          playCount: s.playCount,
          livesSinceLast: s.livesSinceLast,
        })),
        members: draft.members,
        size: suggestSize,
        tempoTarget,
        fameTarget,
        locked: lockedIds,
      }),
    );
  };

  const applySuggestion = (songIds: string[]) => {
    updateDraft((d) => {
      const confirmedMap = new Map(d.items.map((i) => [i.songId, i.confirmed]));
      return {
        ...d,
        items: songIds.map((songId) => ({
          songId,
          confirmed: confirmedMap.get(songId) ?? false,
        })),
      };
    });
    setSuggestions(null);
  };

  const poolProps = {
    songs,
    albums,
    filtered: filteredSongs,
    filter,
    onFilterChange: setFilter,
    sort,
    onSortChange: setSort,
    pickedIds,
    fitDelta,
    sortScore,
    hasDirection,
    wishMember,
    wishesBySong,
    unmetWishes: unsatisfiedWishes,
    onToggle: toggleSong,
    onToggleWish: toggleWish,
    onEditTempo: editTempo,
    tempoEdits: new Set(tempoEdits.keys()),
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* 曲プール(PCのみインライン。モバイルはモーダル) */}
      <div id="song-pool" className="hidden min-w-0 lg:block">
        <TempoEditBar
          count={tempoEdits.size}
          state={attrSaveState}
          onSave={saveTempoEdits}
          onReset={() => setTempoEdits(new Map())}
        />
        <PoolPanel {...poolProps} sticky />
      </div>

      {/* 右カラム: セトリ本体は常に見え、道具はタブで切り替える */}
      <aside className="flex min-w-0 flex-col gap-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start">
        {urlList && (
          <div className="rounded-xl border border-accent/40 bg-accent-soft p-3 text-sm">
            <p className="font-medium text-accent-strong">
              共有されたリスト({urlList.length}曲)が届いています
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  updateDraft((d) => ({
                    ...d,
                    items: urlList.map((songId) => ({ songId, confirmed: false })),
                  }));
                  setUrlList(null);
                }}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-strong"
              >
                読み込む
              </button>
              <button
                type="button"
                onClick={() => setUrlList(null)}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-muted hover:text-foreground"
              >
                無視する
              </button>
            </div>
          </div>
        )}

        {/* セトリ切り替え */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
          {store.drafts.map((d) => (
            <Chip
              key={d.id}
              active={d.id === store.currentId}
              onClick={() => setStore((s) => ({ ...s, currentId: d.id }))}
            >
              {d.eventName || "無題のセトリ"}
              <span className="ml-1 opacity-60">{d.items.length}</span>
            </Chip>
          ))}
          <button
            type="button"
            onClick={() =>
              setStore((s) => {
                const seq = s.seq + 1;
                const d = newDraft(seq, savedMembers);
                return { drafts: [...s.drafts, d], currentId: d.id, seq };
              })
            }
            className="shrink-0 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted hover:border-accent hover:text-accent-strong"
          >
            + 新しいセトリ
          </button>
        </div>

        {/* セトリ本体 */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface lg:flex-[1_1_auto]">
          <LiveInfoCard
            draft={draft}
            onChange={(patch) => updateDraft((d) => ({ ...d, ...patch }))}
          />

          <div className="px-4 pt-2.5">
            <h2 className="flex items-baseline justify-between text-sm font-bold">
              セトリ候補
              <span className="text-xs font-normal text-muted">
                {draft.items.length}曲
                {draft.items.some((i) => i.confirmed) &&
                  ` (確定 ${draft.items.filter((i) => i.confirmed).length})`}
              </span>
            </h2>
            {draft.items.length > 0 && (
              <CompositionBar
                comp={composition}
                fit={currentFit}
                parts={fitParts}
                wishScore={wishScore}
              />
            )}
          </div>

          {/* 曲が増えてもここだけスクロールする */}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2.5">
            {draft.items.length === 0 ? (
              <p className="text-sm text-muted">
                まだ曲がありません。「曲を追加」から履歴を見ながら選べます。
              </p>
            ) : (
              <ol className="space-y-1.5">
                {draft.items.map((item, i) => {
                  const s = songById.get(item.songId);
                  if (!s) return null;
                  const wishers = wishesBySong.get(item.songId);
                  return (
                    <li
                      key={item.songId}
                      className={`rounded-lg border-l-4 bg-surface-2 px-2 py-1.5 ${
                        s.tempo ? TEMPO_BORDER[s.tempo] : "border-l-border"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 shrink-0 text-right font-mono text-xs tabular-nums text-muted">
                          {i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleConfirmed(item.songId)}
                          aria-pressed={item.confirmed}
                          aria-label={`${s.title}を${item.confirmed ? "仮候補に戻す" : "確定にする"}`}
                          title={
                            item.confirmed
                              ? "確定 — 押すと仮候補に戻ります"
                              : "仮候補 — 押すと確定します"
                          }
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] transition-colors ${
                            item.confirmed
                              ? "border-accent bg-accent text-white"
                              : "border-border text-muted hover:border-accent"
                          }`}
                        >
                          ✓
                        </button>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {s.title}
                        </span>
                        <span className="flex shrink-0 items-center">
                          <IconButton
                            label={`${s.title}を上へ`}
                            onClick={() => move(i, -1)}
                            disabled={i === 0}
                          >
                            ↑
                          </IconButton>
                          <IconButton
                            label={`${s.title}を下へ`}
                            onClick={() => move(i, 1)}
                            disabled={i === draft.items.length - 1}
                          >
                            ↓
                          </IconButton>
                          <IconButton
                            label={`${s.title}を外す`}
                            onClick={() => toggleSong(item.songId)}
                          >
                            ×
                          </IconButton>
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1 pl-6">
                        <SongBadgeRow song={s} />
                        {wishers?.map((n) => (
                          <span
                            key={n}
                            className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] leading-none text-accent-strong"
                          >
                            ♥ {n}
                          </span>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {/* 操作は下端に固定 */}
          <div className="border-t border-border p-3">
            <button
              type="button"
              onClick={openPool}
              className="w-full rounded-lg border-2 border-dashed border-accent/50 bg-accent-soft/40 px-3 py-2 text-sm font-semibold text-accent-strong transition-colors hover:border-accent hover:bg-accent-soft"
            >
              + 曲を追加
            </button>
            {draft.items.length > 0 && (
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setExportOpen(true)}
                  className="flex-1 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-strong"
                >
                  ライブ記録に登録
                </button>
                <button
                  type="button"
                  onClick={copyText}
                  title="LINEなどに貼れるテキストでコピー"
                  className="rounded-lg border border-border bg-surface px-2.5 py-2 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-foreground"
                >
                  {copied === "text" ? "✓" : "テキスト"}
                </button>
                <button
                  type="button"
                  onClick={copyLink}
                  title="この候補を共有するリンクをコピー"
                  className="rounded-lg border border-border bg-surface px-2.5 py-2 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-foreground"
                >
                  {copied === "link" ? "✓" : "リンク"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 道具箱: 方向性 / セトリ案 / メンバー */}
        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface lg:flex-[1_1_auto]">
          <div
            role="tablist"
            aria-label="選曲の道具"
            className="flex shrink-0 gap-1 border-b border-border px-2 pt-2"
          >
            {(
              [
                ["direction", "方向性", hasDirection ? "●" : ""],
                ["suggest", "セトリ案", suggestions ? "●" : ""],
                [
                  "members",
                  "メンバー",
                  wishScore !== null && wishScore < 100 ? "●" : "",
                ],
              ] as const
            ).map(([key, label, dot]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tool === key}
                onClick={() => setTool(key)}
                className={`flex items-center gap-1 rounded-t-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  tool === key
                    ? "bg-accent-soft text-accent-strong"
                    : "text-muted hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                {label}
                {dot && (
                  <span aria-hidden className="text-[8px] text-accent">
                    {dot}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {tool === "direction" && (
              <div className="p-4">
                <DirectionMatrix
                  comp={composition}
                  tempoDir={tempoDir}
                  fameDir={fameDir}
                  onSelect={(t, f) =>
                    updateDraft((d) => ({ ...d, tempoDir: t, fameDir: f }))
                  }
                />
              </div>
            )}

            {tool === "suggest" && (
              <SuggestPanel
                suggestions={suggestions}
                size={suggestSize}
                onChangeSize={setSuggestSize}
                onGenerate={generateSuggestions}
                onApply={applySuggestion}
                songTitle={(id) => songById.get(id)?.title ?? id}
                lockedIds={draft.items
                  .filter((i) => i.confirmed)
                  .map((i) => i.songId)}
                hasWishes={draft.members.some((m) => m.wishes.length > 0)}
                directionLabel={
                  hasDirection
                    ? [
                        tempoTarget
                          ? TEMPO_DIRS.find((d) => d.key === tempoDir)?.label
                          : null,
                        fameTarget !== null
                          ? FAME_DIRS.find((d) => d.key === fameDir)?.label
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" × ")
                    : null
                }
                poolCount={filteredSongs.length}
                filtered={isFilterActive(filter)}
              />
            )}

            {tool === "members" && (
              <MembersPanel
                members={draft.members}
                pickedIds={pickedIds}
                songTitle={(id) => songById.get(id)?.title ?? id}
                wishMemberId={wishMemberId}
                onSetWishMember={(id) => {
                  setWishMemberId(id);
                  if (id && !window.matchMedia("(min-width: 1024px)").matches) {
                    setPoolModalOpen(true);
                  }
                }}
                onRename={(id, name) =>
                  updateDraft((d) => ({
                    ...d,
                    members: d.members.map((m) =>
                      m.id === id ? { ...m, name } : m,
                    ),
                  }))
                }
                onAdd={() =>
                  updateDraft((d) => ({
                    ...d,
                    members: [
                      ...d.members,
                      {
                        id: `m${Date.now()}`,
                        name: `メンバー${d.members.length + 1}`,
                        wishes: [],
                      },
                    ],
                  }))
                }
                onRemove={(id) => {
                  if (wishMemberId === id) setWishMemberId(null);
                  updateDraft((d) => ({
                    ...d,
                    members: d.members.filter((m) => m.id !== id),
                  }));
                }}
                onSave={saveMembers}
                onReload={reloadMembers}
                saveState={memberSaveState}
                onRemoveWish={(memberId, songId) =>
                  updateDraft((d) => ({
                    ...d,
                    members: d.members.map((m) =>
                      m.id === memberId
                        ? { ...m, wishes: m.wishes.filter((w) => w !== songId) }
                        : m,
                    ),
                  }))
                }
              />
            )}
          </div>
        </div>

        {store.drafts.length > 1 && (
          <button
            type="button"
            onClick={() => {
              if (!confirm("このセトリを削除しますか?")) return;
              setStore((s) => {
                const drafts = s.drafts.filter((d) => d.id !== s.currentId);
                return { ...s, drafts, currentId: drafts[0].id };
              });
            }}
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs text-muted hover:text-foreground"
          >
            このセトリを削除
          </button>
        )}
      </aside>

      {/* モバイル: 曲追加モーダル */}
      {poolModalOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setPoolModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={wishMember ? `${wishMember.name}の希望曲を登録` : "曲を追加"}
        >
          <div
            className="mt-10 flex min-h-0 flex-1 flex-col rounded-t-2xl border-t border-border bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-1">
              <h2 className="min-w-0 truncate text-sm font-bold">
                {wishMember ? (
                  <>
                    ♥ {wishMember.name}の希望曲
                    <span className="ml-2 font-normal text-muted">
                      {wishMember.wishes.length}曲
                    </span>
                  </>
                ) : (
                  <>
                    曲を追加
                    <span className="ml-2 font-normal text-muted">
                      候補 {draft.items.length}曲
                    </span>
                  </>
                )}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setPoolModalOpen(false);
                  setWishMemberId(null);
                }}
                className="shrink-0 rounded-lg bg-accent px-4 py-1.5 text-sm font-semibold text-white"
              >
                完了
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              <TempoEditBar
                count={tempoEdits.size}
                state={attrSaveState}
                onSave={saveTempoEdits}
                onReset={() => setTempoEdits(new Map())}
              />
              <PoolPanel {...poolProps} autoFocus />
            </div>
          </div>
        </div>
      )}

      {exportOpen && (
        <SetlistExport
          draft={draft}
          songById={songById}
          nextLiveNumber={nextLiveNumber}
          nextEventId={nextEventId}
          onClose={() => setExportOpen(false)}
        />
      )}
    </div>
  );
}

/** テンポを直したときに出る保存バー */
function TempoEditBar({
  count,
  state,
  onSave,
  onReset,
}: {
  count: number;
  state: "idle" | "saving" | "error";
  onSave: () => void;
  onReset: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-accent/40 bg-accent-soft px-3 py-2 text-xs">
      <span className="font-medium text-accent-strong">
        テンポの直し {count}件が未保存です
      </span>
      {state === "error" && (
        <span className="text-[#9b2b2b] dark:text-[#e59a9a]">
          保存できませんでした
        </span>
      )}
      <span className="ml-auto flex gap-2">
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg px-2 py-1 text-muted hover:text-foreground"
        >
          取り消す
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={state === "saving"}
          className="rounded-lg bg-accent px-3 py-1 font-semibold text-white hover:bg-accent-strong disabled:opacity-40"
        >
          {state === "saving" ? "保存中…" : "曲データに保存"}
        </button>
      </span>
    </div>
  );
}

/** 候補リスト行のバッジ(SongBadges の軽量版: 幅が狭いので主要属性のみ) */
function SongBadgeRow({ song }: { song: PickerSong }) {
  const chip = "rounded px-1 py-0.5 text-[10px] leading-none";
  return (
    <>
      {!song.performed && (
        <span className={`${chip} bg-accent text-white`}>未演奏</span>
      )}
      {song.isSingleA && (
        <span className={`${chip} bg-[#f5ecd4] text-[#7d6215] dark:bg-[#3a300f] dark:text-[#d9b44a]`}>
          シングル
        </span>
      )}
      {song.isCoupling && (
        <span className={`${chip} bg-surface text-muted`}>カップリング</span>
      )}
      {song.kouhaku && (
        <span className={`${chip} bg-[#f8dede] text-[#9b2b2b] dark:bg-[#3a1a1a] dark:text-[#e59a9a]`}>
          紅白
        </span>
      )}
      {song.tieup && (
        <span className={`${chip} bg-surface text-muted`} title={song.tieup}>
          タイアップ
        </span>
      )}
      {song.ballad && <span className={`${chip} bg-surface text-muted`}>バラード</span>}
      {song.tempo && (
        <span className={`${chip} bg-surface text-muted`}>{TEMPO_LABEL[song.tempo]}</span>
      )}
      {song.bpm != null && (
        <span className={`${chip} bg-surface font-mono tabular-nums text-muted`}>
          BPM={song.bpm}
        </span>
      )}
    </>
  );
}

function CompositionBar({
  comp,
  fit,
  parts,
  wishScore,
}: {
  comp: Composition;
  fit: number | null;
  parts: { tempo: number | null; fame: number | null };
  wishScore: number | null;
}) {
  const { counts, tempoUnknown, total } = comp;
  if (total === 0) return null;
  const seg = (n: number) => `${(n / total) * 100}%`;
  const tempoEntries: [Tempo, string][] = [
    ["up", "bg-accent"],
    ["mid", "bg-[#b3a89d]"],
    ["slow", "bg-[#6d9fca]"],
  ];
  return (
    <div className="mt-3">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-2">
        {tempoEntries.map(([k, cls]) => (
          <span
            key={k}
            className={cls}
            style={{ width: seg(counts[k]) }}
            title={`${TEMPO_LABEL[k]} ${counts[k]}`}
          />
        ))}
        <span
          className="bg-border"
          style={{ width: seg(tempoUnknown) }}
          title={`テンポ不明 ${tempoUnknown}`}
        />
      </div>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted">
        {tempoEntries.map(([k, cls]) => (
          <span key={k} className="inline-flex items-center gap-1">
            <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${cls}`} />
            {TEMPO_LABEL[k]} {counts[k]}
          </span>
        ))}
        {tempoUnknown > 0 && (
          <span className="inline-flex items-center gap-1">
            <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-border" />
            不明 {tempoUnknown}
          </span>
        )}
      </p>
      {(fit !== null || wishScore !== null) && (
        <p className="mt-1.5 flex flex-wrap items-center justify-end gap-x-2 text-[11px]">
          {fit !== null && (
            <>
              <span className="font-semibold text-accent-strong">適合度 {fit}点</span>
              {parts.tempo !== null && parts.fame !== null && (
                <span className="text-muted">
                  (テンポ {Math.round(parts.tempo)} + 知名度 {Math.round(parts.fame)} の平均)
                </span>
              )}
            </>
          )}
          {wishScore !== null && (
            <span className={wishScore === 100 ? "text-accent-strong" : "text-muted"}>
              希望充足 {wishScore}%
            </span>
          )}
        </p>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="rounded p-1 text-sm text-muted hover:bg-surface hover:text-foreground disabled:opacity-30"
    >
      {children}
    </button>
  );
}

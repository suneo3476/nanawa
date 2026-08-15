"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { matchesQuery, normalizeForSearch } from "@/lib/normalize";
import { formatDateShort } from "@/lib/format";

export interface PickerSong {
  id: string;
  title: string;
  album: string;
  releaseDate: string;
  playCount: number;
  lastDate: string;
  lastEventName: string;
  livesSinceLast: number;
  youtubeCount: number;
}

type SortKey = "gap" | "count" | "rare" | "title";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "gap", label: "ごぶさた順" },
  { key: "count", label: "定番順" },
  { key: "rare", label: "レア曲順" },
  { key: "title", label: "曲名順" },
];

const STORAGE_KEY = "nanawa-picker-v1";

interface PreviewInfo {
  previewUrl: string;
  artworkUrl: string;
  trackName: string;
}

export function SetlistPlanner({ songs }: { songs: PickerSong[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("gap");
  const [picked, setPicked] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [urlList, setUrlList] = useState<string[] | null>(null);
  const [copied, setCopied] = useState<"" | "link" | "text">("");

  const songById = useMemo(
    () => new Map(songs.map((s) => [s.id, s])),
    [songs],
  );

  // localStorage から復元 + URL共有リストの検出。
  // SSGのHTMLと初回描画を一致させるため、マウント後にしか読めない。
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const ids = JSON.parse(saved) as string[];
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 外部ストア(localStorage)からの初期化
        setPicked(ids.filter((id) => songById.has(id)));
      }
    } catch {
      // 壊れた保存データは無視
    }
    const param = new URLSearchParams(window.location.search).get("list");
    if (param) {
      const ids = param.split(",").filter((id) => songById.has(id));
       
      if (ids.length > 0) setUrlList(ids);
    }
     
    setLoaded(true);
  }, [songById]);

  // 保存
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(picked));
    } catch {
      // 保存できなくても致命的ではない
    }
  }, [picked, loaded]);

  const pickedSet = useMemo(() => new Set(picked), [picked]);

  const searchable = useMemo(
    () =>
      songs.map((song) => ({
        song,
        norm: normalizeForSearch(`${song.title} ${song.album}`),
      })),
    [songs],
  );

  const pool = useMemo(() => {
    const hit = searchable
      .filter(({ norm }) => matchesQuery(norm, query))
      .map(({ song }) => song);
    const bySort: Record<SortKey, (a: PickerSong, b: PickerSong) => number> = {
      gap: (a, b) => b.livesSinceLast - a.livesSinceLast,
      count: (a, b) => b.playCount - a.playCount,
      rare: (a, b) => a.playCount - b.playCount,
      title: (a, b) => a.title.localeCompare(b.title, "ja"),
    };
    return [...hit].sort(
      (a, b) => bySort[sort](a, b) || a.title.localeCompare(b.title, "ja"),
    );
  }, [searchable, query, sort]);

  const add = (id: string) =>
    setPicked((p) => (p.includes(id) ? p : [...p, id]));
  const remove = (id: string) => setPicked((p) => p.filter((x) => x !== id));
  const move = (index: number, dir: -1 | 1) =>
    setPicked((p) => {
      const next = [...p];
      const j = index + dir;
      if (j < 0 || j >= next.length) return p;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });

  const shareUrl = () => {
    const url = new URL(window.location.href);
    url.search = picked.length > 0 ? `?list=${picked.join(",")}` : "";
    return url.toString();
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl());
    setCopied("link");
    setTimeout(() => setCopied(""), 2000);
  };

  const copyText = async () => {
    const lines = picked.map((id, i) => {
      const s = songById.get(id)!;
      return `${i + 1}. ${s.title}(通算${s.playCount}回・最終 ${
        s.lastDate ? formatDateShort(s.lastDate) : "未演奏"
      })`;
    });
    const text = [
      `🎵 七輪 選曲候補 ${picked.length}曲`,
      ...lines,
      "",
      shareUrl(),
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied("text");
    setTimeout(() => setCopied(""), 2000);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* 曲プール */}
      <div>
        <div className="sticky top-14 z-30 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="曲名で絞り込み"
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-[15px] shadow-sm outline-none transition-colors placeholder:text-muted/70 focus:border-accent"
            aria-label="曲を検索"
          />
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto">
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSort(s.key)}
                aria-pressed={sort === s.key}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  sort === s.key
                    ? "border-accent bg-accent-soft text-accent-strong"
                    : "border-border bg-surface text-muted hover:border-accent/50 hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {pool.map((song) => (
            <PoolRow
              key={song.id}
              song={song}
              picked={pickedSet.has(song.id)}
              onAdd={() => add(song.id)}
              onRemove={() => remove(song.id)}
            />
          ))}
          {pool.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted">
              条件に一致する曲がありません。
            </li>
          )}
        </ul>
      </div>

      {/* 候補リスト */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        {urlList && (
          <div className="mb-3 rounded-xl border border-accent/40 bg-accent-soft p-3 text-sm">
            <p className="font-medium text-accent-strong">
              共有されたリスト({urlList.length}曲)が届いています
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setPicked(urlList);
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

        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="flex items-baseline justify-between font-bold">
            候補リスト
            <span className="text-xs font-normal text-muted">
              {picked.length}曲
            </span>
          </h2>

          {picked.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              左の一覧から「+」で曲を追加してください。並び順もここで調整できます。
            </p>
          ) : (
            <ol className="mt-3 space-y-1.5">
              {picked.map((id, i) => {
                const s = songById.get(id)!;
                return (
                  <li
                    key={id}
                    className="flex items-center gap-2 rounded-lg bg-surface-2 px-2 py-1.5"
                  >
                    <span className="w-5 shrink-0 text-right font-mono text-xs tabular-nums text-muted">
                      {i + 1}
                    </span>
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
                        disabled={i === picked.length - 1}
                      >
                        ↓
                      </IconButton>
                      <IconButton label={`${s.title}を外す`} onClick={() => remove(id)}>
                        ×
                      </IconButton>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          {picked.length > 0 && (
            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={copyText}
                className="w-full rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
              >
                {copied === "text" ? "コピーしました ✓" : "テキストでコピー(LINE用)"}
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-foreground"
              >
                {copied === "link" ? "コピーしました ✓" : "共有リンクをコピー"}
              </button>
              <button
                type="button"
                onClick={() => setPicked([])}
                className="w-full rounded-lg px-3 py-1.5 text-xs text-muted hover:text-foreground"
              >
                リストを空にする
              </button>
            </div>
          )}
        </div>
      </aside>
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

// ---- 曲プールの1行(試聴つき) ----

// iTunes Search API (キー不要・CORS可) で aiko 本人音源の30秒プレビューを引く
const previewCache = new Map<string, PreviewInfo | null>();

async function fetchPreview(title: string): Promise<PreviewInfo | null> {
  if (previewCache.has(title)) return previewCache.get(title)!;
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
      `aiko ${title}`,
    )}&country=JP&media=music&entity=song&limit=5`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const json = (await res.json()) as {
      results: {
        artistName: string;
        trackName: string;
        previewUrl?: string;
        artworkUrl100?: string;
      }[];
    };
    const hit =
      json.results.find(
        (r) => r.artistName === "aiko" && r.previewUrl,
      ) ?? json.results.find((r) => r.previewUrl);
    const info = hit
      ? {
          previewUrl: hit.previewUrl!,
          artworkUrl: hit.artworkUrl100 ?? "",
          trackName: hit.trackName,
        }
      : null;
    previewCache.set(title, info);
    return info;
  } catch {
    previewCache.set(title, null);
    return null;
  }
}

// ページ内で同時再生は1曲だけにする
let activeAudio: HTMLAudioElement | null = null;

function PoolRow({
  song,
  picked,
  onAdd,
  onRemove,
}: {
  song: PickerSong;
  picked: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "none">(
    "idle",
  );
  const [artwork, setArtwork] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (activeAudio === audioRef.current) activeAudio = null;
    };
  }, []);

  const togglePreview = async () => {
    if (state === "playing") {
      audioRef.current?.pause();
      setState("idle");
      return;
    }
    setState("loading");
    const info = await fetchPreview(song.title);
    if (!info) {
      setState("none");
      return;
    }
    if (info.artworkUrl) setArtwork(info.artworkUrl);
    activeAudio?.pause();
    const audio = new Audio(info.previewUrl);
    audioRef.current = audio;
    activeAudio = audio;
    audio.onended = () => setState("idle");
    audio.onpause = () => setState((s) => (s === "playing" ? "idle" : s));
    try {
      await audio.play();
      setState("playing");
    } catch {
      setState("none");
    }
  };

  const searchQuery = encodeURIComponent(`aiko ${song.title}`);

  return (
    <li className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
      <button
        type="button"
        onClick={picked ? onRemove : onAdd}
        aria-label={picked ? `${song.title}を候補から外す` : `${song.title}を候補に追加`}
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-base font-bold transition-colors ${
          picked
            ? "border-accent bg-accent text-white"
            : "border-border bg-surface text-muted hover:border-accent hover:text-accent-strong"
        }`}
      >
        {picked ? "✓" : "+"}
      </button>

      {artwork ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={artwork}
          alt=""
          width={36}
          height={36}
          className="hidden h-9 w-9 shrink-0 rounded sm:block"
        />
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <Link
            href={`/songs/${song.id}`}
            className="truncate text-sm font-medium underline-offset-4 hover:text-accent-strong hover:underline"
          >
            {song.title}
          </Link>
          <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
            {song.playCount}回
          </span>
        </div>
        <p className="truncate text-[11px] text-muted">
          {song.lastDate
            ? song.livesSinceLast === 0
              ? `直近のライブで演奏 (${formatDateShort(song.lastDate)})`
              : `${song.livesSinceLast}本ごぶさた ・ 最終 ${formatDateShort(song.lastDate)}`
            : "未演奏"}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={togglePreview}
          disabled={state === "none"}
          title={
            state === "none"
              ? "プレビューが見つかりませんでした"
              : "iTunesの30秒プレビューを再生"
          }
          aria-label={`${song.title}を試聴`}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-accent hover:text-accent-strong disabled:opacity-30"
        >
          {state === "loading" ? (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : state === "playing" ? (
            <svg aria-hidden width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          ) : (
            <svg aria-hidden width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          )}
        </button>
        <a
          href={`https://open.spotify.com/search/${searchQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Spotifyで開く(ログイン済みならフル再生)"
          aria-label={`${song.title}をSpotifyで開く`}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-[#1DB954] hover:text-[#1DB954]"
        >
          <svg aria-hidden width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm4.6 14.5a.6.6 0 0 1-.86.2c-2.35-1.44-5.3-1.76-8.8-.96a.63.63 0 1 1-.28-1.22c3.8-.87 7.07-.5 9.7 1.11.3.18.4.57.24.87zm1.23-2.75a.78.78 0 0 1-1.07.26c-2.7-1.66-6.8-2.14-9.98-1.17a.78.78 0 1 1-.46-1.5c3.65-1.1 8.15-.56 11.25 1.34.37.22.48.7.26 1.07zm.1-2.85C14.7 9 9.35 8.82 6.27 9.76a.94.94 0 1 1-.55-1.8c3.55-1.07 9.4-.86 13.1 1.33a.94.94 0 0 1-.96 1.61z" />
          </svg>
        </a>
        <a
          href={`https://music.youtube.com/search?q=${searchQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          title="YouTube Musicで開く(ログイン済みならフル再生)"
          aria-label={`${song.title}をYouTube Musicで開く`}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-[#f00] hover:text-[#f00]"
        >
          <svg aria-hidden width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 14.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zm-1.8-7.2 4.8 2.7-4.8 2.7v-5.4z" />
          </svg>
        </a>
      </div>
    </li>
  );
}

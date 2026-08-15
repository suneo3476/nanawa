"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatDateShort } from "@/lib/format";
import { normalizeForSearch } from "@/lib/normalize";
import { SongBadges } from "@/components/SongBadges";
import { TempoEditor } from "./TempoEditor";
import type { PickerSong } from "./types";

interface PreviewInfo {
  previewUrl: string;
  artworkUrl: string;
}

// ---- iTunes Search API (キー不要・CORS可) ----
// 曲名の完全一致(正規化後)のみ採用し、別の曲を流さない。
// 結果は localStorage に30日キャッシュしてリクエスト自体を減らす。
const CACHE_KEY = "nanawa-itunes-cache-v1";
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

const memoryCache = new Map<string, PreviewInfo | null>();

type CacheFile = Record<string, { at: number; info: PreviewInfo | null }>;

function readCacheFile(): CacheFile {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}") as CacheFile;
  } catch {
    return {};
  }
}

function readCachedPreview(title: string, now: number): PreviewInfo | null | undefined {
  if (memoryCache.has(title)) return memoryCache.get(title);
  const entry = readCacheFile()[title];
  if (!entry || now - entry.at > CACHE_TTL) return undefined;
  memoryCache.set(title, entry.info);
  return entry.info;
}

function writeCachedPreview(title: string, info: PreviewInfo | null, now: number) {
  try {
    const cache = readCacheFile();
    cache[title] = { at: now, info };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // 容量超過などは無視(メモリキャッシュだけで動く)
  }
}

async function fetchPreview(title: string): Promise<PreviewInfo | null> {
  const now = Date.now();
  const cached = readCachedPreview(title, now);
  if (cached !== undefined) return cached;
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
      title,
    )}&country=JP&media=music&entity=song&attribute=songTerm&limit=25`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const json = (await res.json()) as {
      results: {
        artistName?: string;
        trackName?: string;
        previewUrl?: string;
        artworkUrl100?: string;
      }[];
    };
    const want = normalizeForSearch(title);
    const clean = (t: string) =>
      normalizeForSearch(t.replace(/(\(.*\)|（.*）|- .*)$/g, "").trim());
    const hit = json.results.find(
      (r) =>
        r.artistName === "aiko" &&
        r.previewUrl &&
        (normalizeForSearch(r.trackName ?? "") === want ||
          clean(r.trackName ?? "") === want),
    );
    const info = hit
      ? { previewUrl: hit.previewUrl!, artworkUrl: hit.artworkUrl100 ?? "" }
      : null;
    memoryCache.set(title, info);
    writeCachedPreview(title, info, now);
    return info;
  } catch {
    // ネットワークエラーは永続キャッシュしない(次回また試す)
    return null;
  }
}

// ページ内で同時再生は1曲だけにする
let activeAudio: HTMLAudioElement | null = null;

export function SongRow({
  song,
  matchedAlbum,
  picked,
  confirmed,
  fitDelta,
  wishedBy,
  wishModeMember,
  wishedByCurrent,
  onToggle,
  onToggleWish,
  onEditTempo,
  tempoEdited,
}: {
  song: PickerSong;
  matchedAlbum?: string | null;
  picked: boolean;
  confirmed?: boolean;
  fitDelta?: number | null;
  /** この曲を希望しているメンバー名 */
  wishedBy?: string[];
  /** 希望登録モード中のメンバー名(null なら通常モード) */
  wishModeMember?: string | null;
  wishedByCurrent?: boolean;
  onToggle: () => void;
  onToggleWish?: () => void;
  /** テンポ/バラードを直したとき */
  onEditTempo?: (next: {
    tempo: import("@/lib/types").Tempo | null;
    ballad: boolean;
    bpm: number | null;
  }) => void;
  /** 未保存の変更があるか */
  tempoEdited?: boolean;
}) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "none">("idle");
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
    <li className="flex items-start gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-4">
      {wishModeMember ? (
        <button
          type="button"
          onClick={onToggleWish}
          aria-label={
            wishedByCurrent
              ? `${song.title}を${wishModeMember}の希望から外す`
              : `${song.title}を${wishModeMember}の希望曲にする`
          }
          aria-pressed={wishedByCurrent}
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm transition-colors ${
            wishedByCurrent
              ? "border-accent bg-accent text-white"
              : "border-border bg-surface text-muted hover:border-accent hover:text-accent-strong"
          }`}
        >
          ♥
        </button>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          aria-label={picked ? `${song.title}を候補から外す` : `${song.title}を候補に追加`}
          aria-pressed={picked}
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-base font-bold transition-colors ${
            picked
              ? "border-accent bg-accent text-white"
              : "border-border bg-surface text-muted hover:border-accent hover:text-accent-strong"
          }`}
        >
          {picked ? "✓" : "+"}
        </button>
      )}

      {artwork ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={artwork}
          alt=""
          width={36}
          height={36}
          className="mt-0.5 hidden h-9 w-9 shrink-0 rounded sm:block"
        />
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {song.performed ? (
            <Link
              href={`/songs/${song.id}`}
              className="max-w-full truncate text-sm font-medium underline-offset-4 hover:text-accent-strong hover:underline"
            >
              {song.title}
            </Link>
          ) : (
            <span className="max-w-full truncate text-sm font-medium">{song.title}</span>
          )}
          {confirmed && (
            <span className="shrink-0 rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium leading-none text-white">
              確定
            </span>
          )}
          <SongBadges
            song={song}
            showUnperformed
            hideTempo={!!onEditTempo}
            hideBallad={!!onEditTempo}
          />
          {onEditTempo && song.ballad && (
            <TempoEditor
              tempo={song.tempo}
              ballad={song.ballad}
              bpm={song.bpm}
              edited={!!tempoEdited}
              variant="ballad"
              onChange={onEditTempo}
            />
          )}
          {onEditTempo && (
            <TempoEditor
              tempo={song.tempo}
              ballad={song.ballad}
              bpm={song.bpm}
              edited={!!tempoEdited}
              onChange={onEditTempo}
            />
          )}
          {fitDelta != null && fitDelta !== 0 && (
            <span
              className={`shrink-0 font-mono text-[10px] tabular-nums ${
                fitDelta > 0 ? "font-bold text-accent-strong" : "text-muted"
              }`}
              title="候補に足したときの適合度の変化"
            >
              {fitDelta > 0 ? `+${fitDelta}` : fitDelta}
            </span>
          )}
        </div>

        <p className="mt-0.5 truncate text-[11px] text-muted">
          {matchedAlbum && (
            <span className="mr-1 rounded bg-accent-soft px-1 py-px text-[10px] text-accent-strong">
              『{matchedAlbum}』収録
            </span>
          )}
          {song.performed ? (
            <>
              {song.playCount}回演奏
              {song.livesSinceLast === 0
                ? ` ・ 直近のライブで演奏 (${formatDateShort(song.lastDate)})`
                : ` ・ ${song.livesSinceLast}本ごぶさた ・ 最終 ${formatDateShort(song.lastDate)}`}
            </>
          ) : (
            <>
              {song.albums.length > 0 && song.albums[0]}
              {song.releaseDate && ` (${song.releaseDate})`}
            </>
          )}
        </p>

        {wishedBy && wishedBy.length > 0 && (
          <p className="mt-1 flex flex-wrap items-center gap-1">
            {wishedBy.map((name) => (
              <span
                key={name}
                className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] leading-none text-accent-strong"
              >
                ♥ {name}
              </span>
            ))}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={togglePreview}
          disabled={state === "none"}
          title={
            state === "none"
              ? "aikoの音源が見つかりませんでした"
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
          className="hidden h-7 w-7 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-[#1DB954] hover:text-[#1DB954] sm:flex"
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
          className="hidden h-7 w-7 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-[#f00] hover:text-[#f00] sm:flex"
        >
          <svg aria-hidden width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 14.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zm-1.8-7.2 4.8 2.7-4.8 2.7v-5.4z" />
          </svg>
        </a>
      </div>
    </li>
  );
}

"use client";

import { useState } from "react";
import type { Season, Tempo } from "@/lib/types";

export const TEMPO_LABEL: Record<Tempo, string> = {
  up: "アップ",
  mid: "ミドル",
  slow: "スロー",
};
export const TEMPO_CLASS: Record<Tempo, string> = {
  up: "bg-accent-soft text-accent-strong",
  mid: "bg-[#efe7dd] text-[#6b5b4a] dark:bg-[#302a23] dark:text-[#c3b3a0]",
  slow: "bg-[#dce8f5] text-[#33628f] dark:bg-[#1d2e40] dark:text-[#8fb8dd]",
};
/** 候補リストの行頭ストリップ(構成バーと同色) */
export const TEMPO_BORDER: Record<Tempo, string> = {
  up: "border-l-[var(--accent)]",
  mid: "border-l-[#b3a89d]",
  slow: "border-l-[#6d9fca]",
};

export const SEASON_LABEL: Record<Season, string> = {
  spring: "春",
  summer: "夏",
  autumn: "秋",
  winter: "冬",
};
const SEASON_CLASS: Record<Season, string> = {
  spring: "bg-[#fbe4ee] text-[#a04570] dark:bg-[#3b1f2c] dark:text-[#e29bbd]",
  summer: "bg-[#dff0f5] text-[#1f6f86] dark:bg-[#13303a] dark:text-[#7fc8dd]",
  autumn: "bg-[#f7e6d2] text-[#8a5a22] dark:bg-[#3a2a15] dark:text-[#d6a869]",
  winter: "bg-[#e6e9f5] text-[#4a5490] dark:bg-[#212639] dark:text-[#a3adde]",
};

export interface BadgeSong {
  tempo: Tempo | null;
  ballad: boolean | null;
  bpm: number | null;
  isSingleA: boolean;
  isCoupling: boolean;
  kouhaku: boolean;
  tieup: string | null;
  seasons: Season[];
  performed?: boolean;
}

const base = "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium leading-none";

/**
 * 曲に付く属性バッジ一式。候補リストでも検索結果でも同じ見た目にする。
 * 単体で意味が読み取れるよう、色ではなく文字でラベルする。
 */
export function SongBadges({
  song,
  showUnperformed = false,
  hideTempo = false,
  hideBallad = false,
}: {
  song: BadgeSong;
  showUnperformed?: boolean;
  /** テンポを別のUI(編集可能なバッジ)で出すとき */
  hideTempo?: boolean;
  /** バラードを別のUI(編集可能なバッジ)で出すとき */
  hideBallad?: boolean;
}) {
  return (
    <>
      {showUnperformed && song.performed === false && (
        <span className={`${base} bg-accent text-white`}>未演奏</span>
      )}
      {song.isSingleA && (
        <span className={`${base} bg-[#f5ecd4] text-[#7d6215] dark:bg-[#3a300f] dark:text-[#d9b44a]`}>
          シングル
        </span>
      )}
      {song.isCoupling && (
        <span className={`${base} bg-surface-2 text-muted`}>カップリング</span>
      )}
      {song.kouhaku && (
        <span className={`${base} bg-[#f8dede] text-[#9b2b2b] dark:bg-[#3a1a1a] dark:text-[#e59a9a]`}>
          紅白
        </span>
      )}
      {song.tieup && <TieupBadge text={song.tieup} />}
      {song.ballad && !hideBallad && (
        <span className={`${base} bg-surface-2 text-muted`}>バラード</span>
      )}
      {song.tempo && !hideTempo && (
        <span className={`${base} ${TEMPO_CLASS[song.tempo]}`}>
          {TEMPO_LABEL[song.tempo]}
        </span>
      )}
      {song.bpm != null && (
        <span
          className={`${base} font-mono tabular-nums ${
            // テンポ区分と食い違う値は倍/半分で検出された可能性が高い
            (song.tempo === "slow" && song.bpm >= 130) ||
            (song.tempo === "up" && song.bpm <= 95)
              ? "bg-[#fbe9e9] text-[#9b2b2b] dark:bg-[#3a1a1a] dark:text-[#e59a9a]"
              : "bg-surface-2 text-muted"
          }`}
          title={
            (song.tempo === "slow" && song.bpm >= 130) ||
            (song.tempo === "up" && song.bpm <= 95)
              ? "テンポ区分と食い違っています。倍/半分で取れているかもしれません"
              : undefined
          }
        >
          BPM={song.bpm}
        </span>
      )}
      {song.seasons.map((s) => (
        <span key={s} className={`${base} ${SEASON_CLASS[s]}`}>
          {SEASON_LABEL[s]}
        </span>
      ))}
    </>
  );
}

/** タイアップバッジ: クリックで内容(何のタイアップか)を表示 */
function TieupBadge({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
        aria-expanded={open}
        aria-label={`タイアップの詳細: ${text}`}
        className={`${base} inline-flex items-center gap-0.5 border transition-colors ${
          open
            ? "border-accent bg-accent-soft text-accent-strong"
            : "border-transparent bg-surface-2 text-muted hover:border-accent/50"
        }`}
      >
        タイアップ
        <span aria-hidden className="text-[9px] opacity-70">
          ⓘ
        </span>
      </button>
      {open && (
        <>
          <span
            className="fixed inset-0 z-40 cursor-default"
            aria-hidden
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <span
            role="note"
            className="absolute top-5 left-0 z-50 block w-56 rounded-lg border border-border bg-surface p-2 text-[11px] leading-relaxed font-normal text-foreground shadow-xl"
          >
            {text}
          </span>
        </>
      )}
    </span>
  );
}

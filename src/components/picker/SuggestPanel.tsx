"use client";

import { useState } from "react";
import type { Suggestion } from "@/lib/suggest";
import { TEMPO_LABEL } from "@/components/SongBadges";

/**
 * セトリ候補の提案(3パターン)。
 * 曲数を決めて「提案する」を押すと、確定済みの曲を残したまま案を作る。
 */
export function SuggestPanel({
  suggestions,
  size,
  onChangeSize,
  onGenerate,
  onApply,
  songTitle,
  lockedCount,
  hasWishes,
}: {
  suggestions: Suggestion[] | null;
  size: number;
  onChangeSize: (n: number) => void;
  onGenerate: () => void;
  onApply: (songIds: string[]) => void;
  songTitle: (songId: string) => string;
  lockedCount: number;
  hasWishes: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h2 className="text-sm font-bold">セトリ案を作ってもらう</h2>
      <p className="mt-1 text-[11px] leading-relaxed text-muted">
        {hasWishes
          ? "メンバーの希望と方向性をもとに3パターン提案します。"
          : "メンバーの希望曲を登録しておくと、全員の希望を満たす案も出せます。"}
        {lockedCount > 0 && `確定済みの${lockedCount}曲は必ず残します。`}
      </p>

      <div className="mt-2.5 flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-muted">
          曲数
          <input
            type="number"
            min={1}
            max={30}
            value={size}
            onChange={(e) => onChangeSize(Number(e.target.value))}
            className="w-14 rounded border border-border bg-background px-2 py-1 text-sm tabular-nums outline-none focus:border-accent"
          />
        </label>
        <button
          type="button"
          onClick={onGenerate}
          className="flex-1 rounded-lg border border-accent bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-strong transition-colors hover:bg-accent hover:text-white"
        >
          {suggestions ? "作り直す" : "提案する"}
        </button>
      </div>

      {suggestions && (
        <ul className="mt-3 space-y-2">
          {suggestions.map((s) => {
            const expanded = open === s.key;
            const c = s.composition.counts;
            return (
              <li key={s.key} className="rounded-lg border border-border bg-surface-2 p-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-xs font-bold">{s.label}</h3>
                  <span className="shrink-0 text-[11px] tabular-nums">
                    {s.fit !== null && (
                      <span className="font-semibold text-accent-strong">
                        適合 {s.fit}
                      </span>
                    )}
                    {s.wish !== null && (
                      <span
                        className={`ml-1.5 ${s.wish === 100 ? "font-semibold text-accent-strong" : "text-muted"}`}
                      >
                        希望 {s.wish}%
                      </span>
                    )}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
                  {s.description}
                </p>
                <p className="mt-1 text-[10px] text-muted">
                  {TEMPO_LABEL.up} {c.up} / {TEMPO_LABEL.mid} {c.mid} /{" "}
                  {TEMPO_LABEL.slow} {c.slow}
                  {s.composition.tempoUnknown > 0 &&
                    ` / 不明 ${s.composition.tempoUnknown}`}
                  {` ・ 有名 ${s.composition.famous}/${s.composition.total}`}
                </p>

                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : s.key)}
                  aria-expanded={expanded}
                  className="mt-1.5 text-[11px] text-muted underline underline-offset-2 hover:text-foreground"
                >
                  {expanded ? "曲を隠す" : `曲を見る (${s.songIds.length}曲)`}
                </button>
                {expanded && (
                  <ol className="mt-1.5 space-y-0.5">
                    {s.songIds.map((id, i) => (
                      <li key={id} className="flex gap-1.5 text-[11px]">
                        <span className="w-4 shrink-0 text-right font-mono tabular-nums text-muted">
                          {i + 1}
                        </span>
                        <span className="truncate">{songTitle(id)}</span>
                      </li>
                    ))}
                  </ol>
                )}

                <button
                  type="button"
                  onClick={() => onApply(s.songIds)}
                  className="mt-2 w-full rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-strong"
                >
                  この案を候補にする
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

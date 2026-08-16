"use client";

import type { Suggestion } from "@/lib/suggest";
import { TEMPO_LABEL } from "@/components/SongBadges";

/**
 * セトリ案の提案(3パターン)。
 * 確定済みの曲は必ず残し、絞り込み中ならその範囲から、
 * 方向性を選んでいればその適合度が上がるように選ぶ。
 */
export function SuggestPanel({
  suggestions,
  size,
  onChangeSize,
  onGenerate,
  onApply,
  songTitle,
  lockedIds,
  hasWishes,
  directionLabel,
  poolCount,
  filtered,
}: {
  suggestions: Suggestion[] | null;
  size: number;
  onChangeSize: (n: number) => void;
  onGenerate: () => void;
  onApply: (songIds: string[]) => void;
  songTitle: (songId: string) => string;
  /** 確定済み(必ず残す)曲 */
  lockedIds: string[];
  hasWishes: boolean;
  /** 選んでいる方向性の説明。未選択なら null */
  directionLabel: string | null;
  /** 提案の母集団になる曲数 */
  poolCount: number;
  /** 絞り込み中かどうか */
  filtered: boolean;
}) {
  const lockedSet = new Set(lockedIds);
  const remaining = Math.max(0, size - lockedIds.length);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h2 className="text-sm font-bold">セトリ案を作ってもらう</h2>
      <ul className="mt-1.5 space-y-0.5 text-[11px] leading-relaxed text-muted">
        <li>
          対象: {poolCount}曲
          {filtered && (
            <span className="text-accent-strong">(いまの絞り込みの範囲)</span>
          )}
        </li>
        <li>
          方向性:{" "}
          {directionLabel ? (
            <span className="text-accent-strong">{directionLabel}</span>
          ) : (
            "未選択(上の表からマスを選ぶと反映されます)"
          )}
        </li>
        <li>
          {lockedIds.length > 0
            ? `確定 ${lockedIds.length}曲はそのまま残し、残り ${remaining}曲を提案します`
            : "確定した曲(セトリ候補の✓)があれば、それは必ず残します"}
        </li>
        {!hasWishes && <li>メンバーの希望曲を登録すると希望も考慮します</li>}
      </ul>

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
            const c = s.composition.counts;
            return (
              <li
                key={s.key}
                className="rounded-lg border border-border bg-surface-2 p-2.5"
              >
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
                        className={`ml-1.5 ${
                          s.wish === 100
                            ? "font-semibold text-accent-strong"
                            : "text-muted"
                        }`}
                      >
                        希望 {s.wish}%
                      </span>
                    )}
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
                  {s.description}
                </p>

                <ol className="mt-1.5 space-y-0.5">
                  {s.songIds.map((id, i) => (
                    <li key={id} className="flex items-center gap-1.5 text-[11px]">
                      <span className="w-4 shrink-0 text-right font-mono tabular-nums text-muted">
                        {i + 1}
                      </span>
                      <span className="truncate">{songTitle(id)}</span>
                      {lockedSet.has(id) && (
                        <span className="shrink-0 rounded bg-accent px-1 py-px text-[9px] leading-none text-white">
                          確定
                        </span>
                      )}
                    </li>
                  ))}
                </ol>

                <p className="mt-1.5 text-[10px] text-muted">
                  {TEMPO_LABEL.up} {c.up} / {TEMPO_LABEL.mid} {c.mid} /{" "}
                  {TEMPO_LABEL.slow} {c.slow}
                  {s.composition.tempoUnknown > 0 &&
                    ` / 不明 ${s.composition.tempoUnknown}`}
                  {` ・ 有名 ${s.composition.famous}/${s.composition.total}`}
                </p>

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

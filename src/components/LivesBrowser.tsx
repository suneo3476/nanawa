"use client";

import { useMemo, useState } from "react";
import type { LiveDetail } from "@/lib/types";
import { matchesQuery, normalizeForSearch } from "@/lib/normalize";
import { LiveCard } from "./LiveCard";

/** トップページの心臓部: ライブ履歴のインクリメンタル検索ブラウザ */
export function LivesBrowser({
  lives,
  years,
}: {
  lives: LiveDetail[]; // 新しい順
  years: number[];
}) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [videoOnly, setVideoOnly] = useState(false);

  // ライブごとの検索対象テキスト(曲名込み)を一度だけ構築
  const searchable = useMemo(
    () =>
      lives.map((live) => ({
        live,
        norm: normalizeForSearch(
          [
            live.eventName,
            live.venueName,
            live.date,
            `${live.date.slice(0, 4)}年`,
            live.memo,
            ...live.setlist.map((s) => s.songTitle),
          ].join(" "),
        ),
      })),
    [lives],
  );

  // クエリに曲名がヒットした場合、カード内でその曲をハイライトする
  const songMatcher = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    const ids = new Set<string>();
    for (const { live } of searchable) {
      for (const s of live.setlist) {
        if (matchesQuery(normalizeForSearch(s.songTitle), q)) ids.add(s.songId);
      }
    }
    return ids.size > 0 ? ids : null;
  }, [searchable, query]);

  const filtered = useMemo(
    () =>
      searchable
        .filter(({ live, norm }) => {
          if (year !== null && !live.date.startsWith(String(year))) return false;
          if (videoOnly && live.youtubeCount === 0) return false;
          return matchesQuery(norm, query);
        })
        .map(({ live }) => live),
    [searchable, query, year, videoOnly],
  );

  const byYear = useMemo(() => {
    const groups: { year: number; lives: LiveDetail[] }[] = [];
    for (const live of filtered) {
      const y = live.year;
      const last = groups.at(-1);
      if (last && last.year === y) last.lives.push(live);
      else groups.push({ year: y, lives: [live] });
    }
    return groups;
  }, [filtered]);

  return (
    <div>
      {/* 検索コントロール */}
      <div className="sticky top-14 z-30 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="relative">
          <svg
            aria-hidden
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="曲名・イベント名・会場名・年 で絞り込み (例: カブトムシ)"
            className="w-full rounded-xl border border-border bg-surface py-2.5 pr-10 pl-10 text-[15px] shadow-sm outline-none transition-colors placeholder:text-muted/70 focus:border-accent"
            aria-label="ライブ履歴を検索"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="検索をクリア"
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-1 text-muted hover:bg-surface-2 hover:text-foreground"
            >
              <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </div>

        <div className="no-scrollbar mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch]">
          <FilterChip active={year === null} onClick={() => setYear(null)}>
            全期間
          </FilterChip>
          {[...years].reverse().map((y) => (
            <FilterChip
              key={y}
              active={year === y}
              onClick={() => setYear(year === y ? null : y)}
            >
              {y}
            </FilterChip>
          ))}
          <span className="mx-1 h-4 w-px shrink-0 bg-border" />
          <FilterChip active={videoOnly} onClick={() => setVideoOnly(!videoOnly)}>
            動画あり
          </FilterChip>
        </div>
      </div>

      {/* 結果 */}
      <p className="py-3 text-xs text-muted" role="status">
        {filtered.length === lives.length
          ? `全 ${lives.length} 件`
          : `${filtered.length} 件がヒット (全 ${lives.length} 件中)`}
      </p>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
          条件に一致するライブがありません。キーワードを短くするか、年の絞り込みを外してみてください。
        </div>
      )}

      <div className="space-y-8">
        {byYear.map((group) => (
          <section key={group.year} id={`year-${group.year}`}>
            <h2 className="mb-3 flex items-baseline gap-2 text-lg font-bold">
              {group.year}
              <span className="text-xs font-normal text-muted">
                {group.lives.length}本
              </span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.lives.map((live) => (
                <LiveCard
                  key={live.id}
                  live={live}
                  highlightSongIds={songMatcher ?? undefined}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-accent bg-accent-soft text-accent-strong"
          : "border-border bg-surface text-muted hover:border-accent/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

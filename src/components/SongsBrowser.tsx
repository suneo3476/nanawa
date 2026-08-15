"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { matchesQuery, normalizeForSearch } from "@/lib/normalize";
import { formatDateShort } from "@/lib/format";

export interface SongSummary {
  id: string;
  title: string;
  album: string;
  releaseDate: string;
  isSingle: boolean;
  playCount: number;
  firstDate: string;
  lastDate: string;
  yearCounts: Record<number, number>;
  youtubeCount: number;
}

type SortKey = "count" | "recent" | "gap" | "title";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "count", label: "演奏回数順" },
  { key: "recent", label: "最近やった順" },
  { key: "gap", label: "ごぶさた順" },
  { key: "title", label: "曲名順" },
];

export function SongsBrowser({
  songs,
  years,
}: {
  songs: SongSummary[];
  years: number[];
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("count");

  const searchable = useMemo(
    () =>
      songs.map((song) => ({
        song,
        norm: normalizeForSearch(`${song.title} ${song.album}`),
      })),
    [songs],
  );

  const filtered = useMemo(() => {
    const hit = searchable
      .filter(({ norm }) => matchesQuery(norm, query))
      .map(({ song }) => song);
    const bySort: Record<SortKey, (a: SongSummary, b: SongSummary) => number> = {
      count: (a, b) => b.playCount - a.playCount,
      recent: (a, b) => b.lastDate.localeCompare(a.lastDate),
      gap: (a, b) => a.lastDate.localeCompare(b.lastDate),
      title: (a, b) => a.title.localeCompare(b.title, "ja"),
    };
    return [...hit].sort(
      (a, b) => bySort[sort](a, b) || a.title.localeCompare(b.title, "ja"),
    );
  }, [searchable, query, sort]);

  return (
    <div>
      <div className="sticky top-14 z-30 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="曲名・アルバム名で絞り込み"
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-[15px] shadow-sm outline-none transition-colors placeholder:text-muted/70 focus:border-accent"
          aria-label="楽曲を検索"
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

      <p className="py-3 text-xs text-muted" role="status">
        {filtered.length === songs.length
          ? `全 ${songs.length} 曲`
          : `${filtered.length} 曲がヒット (全 ${songs.length} 曲中)`}
      </p>

      <ul className="grid gap-3 sm:grid-cols-2">
        {filtered.map((song) => (
          <li key={song.id}>
            <Link
              href={`/songs/${song.id}`}
              className="group block h-full rounded-xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold group-hover:text-accent-strong">
                    {song.title}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {song.album || "アルバム情報なし"}
                    {song.releaseDate && ` (${song.releaseDate})`}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg bg-accent-soft px-2 py-1 text-center">
                  <span className="block font-mono text-lg font-bold leading-none tabular-nums text-accent-strong">
                    {song.playCount}
                  </span>
                  <span className="text-[10px] text-accent-strong/80">回</span>
                </span>
              </div>
              <Sparkline yearCounts={song.yearCounts} years={years} />
              <p className="mt-1.5 flex flex-wrap gap-x-3 text-[11px] text-muted">
                <span>初 {formatDateShort(song.firstDate)}</span>
                <span>最終 {formatDateShort(song.lastDate)}</span>
                {song.youtubeCount > 0 && (
                  <span className="text-accent-strong">
                    動画 {song.youtubeCount}
                  </span>
                )}
              </p>
            </Link>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
          条件に一致する曲がありません。
        </div>
      )}
    </div>
  );
}

/** 年ごとの演奏回数を並べた小さなバー。活動全期間を通した「いつやってたか」が一目で分かる */
function Sparkline({
  yearCounts,
  years,
}: {
  yearCounts: Record<number, number>;
  years: number[];
}) {
  const max = Math.max(1, ...Object.values(yearCounts));
  return (
    <div
      className="mt-3 flex h-6 items-end gap-px"
      aria-hidden
      title={years
        .filter((y) => yearCounts[y])
        .map((y) => `${y}: ${yearCounts[y]}回`)
        .join(", ")}
    >
      {years.map((y) => {
        const c = yearCounts[y] ?? 0;
        return (
          <span
            key={y}
            className={`flex-1 rounded-t-[2px] ${c > 0 ? "bg-accent/70" : "bg-border/60"}`}
            style={{ height: c > 0 ? `${25 + (c / max) * 75}%` : "3px" }}
          />
        );
      })}
    </div>
  );
}

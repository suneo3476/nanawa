import type { Metadata } from "next";
import Link from "next/link";
import { getAllLives, getAllSongs, getSummary } from "@/lib/data";

export const metadata: Metadata = {
  title: "統計",
  description: "七輪の活動統計。年別ライブ回数、演奏回数ランキング、曲×年のヒートマップ。",
};

export default function StatsPage() {
  const summary = getSummary();
  const lives = getAllLives();
  const songs = getAllSongs()
    .filter((s) => s.playCount > 0)
    .sort((a, b) => b.playCount - a.playCount || a.title.localeCompare(b.title, "ja"));

  const livesPerYear: Record<number, number> = {};
  for (const l of lives) {
    livesPerYear[l.year] = (livesPerYear[l.year] ?? 0) + 1;
  }
  const maxLivesPerYear = Math.max(...Object.values(livesPerYear));
  const top10 = songs.slice(0, 10);
  const maxHeat = Math.max(
    1,
    ...songs.flatMap((s) => Object.values(s.yearCounts)),
  );

  return (
    <div className="pt-8">
      <section className="pb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">統計</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          {summary.years[0]}年からの活動を数字で振り返ります。
        </p>
      </section>

      {/* サマリー */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="ライブ" value={summary.liveCount} unit="回" />
        <Stat label="演奏曲" value={summary.songCount} unit="曲" />
        <Stat label="会場" value={summary.venueCount} unit="ヶ所" />
        <Stat label="演奏動画" value={summary.youtubeCount} unit="本" />
      </section>

      {/* 年別ライブ回数 */}
      <section className="mt-8">
        <h2 className="mb-2 text-lg font-bold">年別ライブ回数</h2>
        <div className="overflow-x-auto rounded-xl border border-border bg-surface p-4">
          <div className="flex h-32 min-w-[560px] items-end gap-1">
            {summary.years.map((y) => {
              const c = livesPerYear[y] ?? 0;
              return (
                <div key={y} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-medium tabular-nums text-muted">
                    {c}
                  </span>
                  <div
                    className="w-full rounded-t bg-accent/80"
                    style={{ height: `${(c / maxLivesPerYear) * 84}px` }}
                    title={`${y}年: ${c}回`}
                  />
                  <span className="text-[10px] tabular-nums text-muted [writing-mode:vertical-rl]">
                    {y}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 演奏回数 Top10 */}
      <section className="mt-8">
        <h2 className="mb-2 text-lg font-bold">演奏回数 Top 10</h2>
        <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {top10.map((s, i) => (
            <li key={s.id}>
              <Link
                href={`/songs/${s.id}`}
                className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-2"
              >
                <span className="w-6 shrink-0 text-right font-mono text-sm tabular-nums text-muted">
                  {i + 1}
                </span>
                <span className="w-32 shrink-0 truncate text-sm font-medium sm:w-44">
                  {s.title}
                </span>
                <span className="h-4 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <span
                    className="block h-full rounded-full bg-accent/80"
                    style={{ width: `${(s.playCount / top10[0].playCount) * 100}%` }}
                  />
                </span>
                <span className="w-10 shrink-0 text-right font-mono text-sm font-bold tabular-nums">
                  {s.playCount}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      {/* ヒートマップ */}
      <section className="mt-8">
        <h2 className="mb-1 text-lg font-bold">曲 × 年 ヒートマップ</h2>
        <p className="mb-3 text-xs text-muted">
          全{songs.length}曲の年ごとの演奏回数。濃いほど多く演奏。曲名クリックで演奏履歴へ。
        </p>
        <div className="max-h-[75vh] overflow-auto rounded-xl border border-border bg-surface">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-20 min-w-36 border-b border-border bg-surface px-3 py-2 text-left font-medium text-muted">
                  曲名
                </th>
                {summary.years.map((y) => (
                  <th
                    key={y}
                    className="sticky top-0 z-10 min-w-8 border-b border-border bg-surface px-1 py-2 text-center font-normal tabular-nums text-muted"
                  >
                    {String(y).slice(2)}
                  </th>
                ))}
                <th className="sticky top-0 z-10 min-w-10 border-b border-border bg-surface px-2 py-2 text-right font-medium text-muted">
                  計
                </th>
              </tr>
            </thead>
            <tbody>
              {songs.map((s) => (
                <tr key={s.id} className="group">
                  <th className="sticky left-0 z-10 border-b border-border bg-surface px-3 py-1.5 text-left font-normal group-hover:bg-surface-2">
                    <Link
                      href={`/songs/${s.id}`}
                      className="block max-w-40 truncate hover:text-accent-strong hover:underline"
                    >
                      {s.title}
                    </Link>
                  </th>
                  {summary.years.map((y) => {
                    const c = s.yearCounts[y] ?? 0;
                    return (
                      <td
                        key={y}
                        className="border-b border-border p-0.5 text-center"
                        title={`${s.title} / ${y}年: ${c}回`}
                      >
                        <span
                          className="mx-auto flex h-6 w-7 items-center justify-center rounded font-mono tabular-nums"
                          style={
                            c > 0
                              ? {
                                  background: `color-mix(in oklab, var(--accent) ${20 + (c / maxHeat) * 80}%, var(--surface))`,
                                  color:
                                    c / maxHeat > 0.45
                                      ? "#fff"
                                      : "var(--foreground)",
                                }
                              : undefined
                          }
                        >
                          {c > 0 ? c : ""}
                        </span>
                      </td>
                    );
                  })}
                  <td className="border-b border-border px-2 py-1.5 text-right font-mono font-bold tabular-nums">
                    {s.playCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <span className="text-xs text-muted">{label}</span>
      <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
        {value}
        <span className="ml-0.5 text-sm font-normal text-muted">{unit}</span>
      </p>
    </div>
  );
}

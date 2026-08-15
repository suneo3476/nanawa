import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllLives, getAllSongs, getSong, getSummary } from "@/lib/data";
import { formatDate, formatDateShort } from "@/lib/format";
import { YouTubeEmbed } from "@/components/YouTubeEmbed";
import { SongBadges } from "@/components/SongBadges";

export function generateStaticParams() {
  return getAllSongs()
    .filter((s) => s.playCount > 0)
    .map((s) => ({ songId: s.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/songs/[songId]">): Promise<Metadata> {
  const { songId } = await params;
  const song = getSong(songId);
  if (!song) return {};
  return {
    title: song.title,
    description: `「${song.title}」の演奏履歴。これまでに${song.playCount}回演奏。`,
  };
}

export default async function SongPage({
  params,
}: PageProps<"/songs/[songId]">) {
  const { songId } = await params;
  const song = getSong(songId);
  if (!song || song.playCount === 0) notFound();

  const summary = getSummary();
  // 最後に演奏してから何本のライブが空いているか(=「ごぶさた度」)
  const livesSinceLast = song.lastPerformance
    ? getAllLives().filter((l) => l.date > song.lastPerformance!.date).length
    : 0;

  return (
    <div className="pt-8">
      <nav className="text-xs text-muted" aria-label="パンくず">
        <Link href="/songs" className="hover:text-accent-strong hover:underline">
          楽曲
        </Link>
        <span className="mx-1.5">/</span>
        <span>{song.title}</span>
      </nav>

      <header className="mt-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{song.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <SongBadges song={song} />
        </div>
        {song.tieup && (
          <p className="mt-1.5 text-xs text-muted">{song.tieup}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
          {song.appearsOn.length > 0
            ? song.appearsOn.map((a) => (
                <span
                  key={a.albumId}
                  className="rounded bg-surface-2 px-2 py-0.5 text-muted"
                >
                  {a.albumTitle}
                  {a.releaseDate && ` (${a.releaseDate})`} #{a.trackNumber}
                </span>
              ))
            : song.album && (
                <span className="rounded bg-surface-2 px-2 py-0.5 text-muted">
                  {song.album}
                  {song.releaseDate && ` (${song.releaseDate})`}
                  {song.trackNumber != null && ` #${song.trackNumber}`}
                </span>
              )}
        </div>
      </header>

      {/* 統計 */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="演奏回数" value={`${song.playCount}回`} />
        <StatCard
          label="初披露"
          value={song.firstPerformance ? formatDateShort(song.firstPerformance.date) : "-"}
          sub={song.firstPerformance?.eventName}
          href={song.firstPerformance ? `/lives/${song.firstPerformance.liveId}` : undefined}
        />
        <StatCard
          label="最終演奏"
          value={song.lastPerformance ? formatDateShort(song.lastPerformance.date) : "-"}
          sub={song.lastPerformance?.eventName}
          href={song.lastPerformance ? `/lives/${song.lastPerformance.liveId}` : undefined}
        />
        <StatCard
          label="ごぶさた度"
          value={livesSinceLast === 0 ? "直近で演奏" : `${livesSinceLast}本ぶり`}
          sub={livesSinceLast > 0 ? "最終演奏以降のライブ数" : undefined}
        />
      </section>

      {/* 年別チャート */}
      <section className="mt-6">
        <h2 className="mb-2 text-lg font-bold">年別演奏回数</h2>
        <YearChart yearCounts={song.yearCounts} years={summary.years} />
      </section>

      {/* 一緒に演奏された曲 */}
      {song.coPerformed.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-bold">よく一緒に演奏された曲</h2>
          <div className="flex flex-wrap gap-1.5">
            {song.coPerformed.map((c) => (
              <Link
                key={c.songId}
                href={`/songs/${c.songId}`}
                className="rounded-full border border-border bg-surface px-3 py-1 text-sm transition-colors hover:border-accent hover:text-accent-strong"
              >
                {c.title}
                <span className="ml-1 text-xs text-muted">{c.count}回</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 演奏履歴 */}
      <section className="mt-6">
        <h2 className="mb-2 flex items-baseline gap-2 text-lg font-bold">
          演奏履歴
          <span className="text-xs font-normal text-muted">新しい順</span>
        </h2>
        <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
          {song.performances.map((p) => (
            <li key={`${p.liveId}-${p.order}`} className="px-4 py-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <time className="font-mono text-sm tabular-nums text-muted">
                  {formatDate(p.date)}
                </time>
                <Link
                  href={`/lives/${p.liveId}`}
                  className="font-medium underline-offset-4 hover:text-accent-strong hover:underline"
                >
                  {p.eventName}
                </Link>
                <span className="text-xs text-muted">
                  {p.order}曲目/{p.setlistLength}曲
                </span>
                {p.type === "medley" && (
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted">
                    メドレー
                  </span>
                )}
              </div>
              {p.venueName && (
                <p className="mt-0.5 text-xs text-muted">{p.venueName}</p>
              )}
              {p.youtubeUrl && (
                <div className="mt-1.5">
                  <YouTubeEmbed
                    url={p.youtubeUrl}
                    title={`${song.title} @ ${p.eventName}`}
                  />
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
}) {
  const body = (
    <>
      <span className="block text-xs text-muted">{label}</span>
      <span className="mt-1 block font-mono text-lg font-bold tabular-nums leading-tight">
        {value}
      </span>
      {sub && (
        <span className="mt-0.5 block truncate text-[11px] text-muted">{sub}</span>
      )}
    </>
  );
  const cls =
    "block rounded-xl border border-border bg-surface p-3 transition-colors";
  return href ? (
    <Link href={href} className={`${cls} hover:border-accent`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function YearChart({
  yearCounts,
  years,
}: {
  yearCounts: Record<number, number>;
  years: number[];
}) {
  const max = Math.max(1, ...Object.values(yearCounts));
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface p-4">
      <div className="flex h-28 min-w-[560px] items-end gap-1">
        {years.map((y) => {
          const c = yearCounts[y] ?? 0;
          return (
            <div key={y} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-medium tabular-nums text-muted">
                {c > 0 ? c : ""}
              </span>
              <div
                className={`w-full rounded-t ${c > 0 ? "bg-accent/80" : "bg-border/50"}`}
                style={{ height: c > 0 ? `${(c / max) * 72}px` : "2px" }}
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
  );
}

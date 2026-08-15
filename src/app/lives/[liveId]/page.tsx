import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllLives, getLive, venueSlug } from "@/lib/data";
import { formatDate, formatDateShort } from "@/lib/format";
import { SetlistView } from "@/components/SetlistView";

export function generateStaticParams() {
  return getAllLives().map((live) => ({ liveId: live.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/lives/[liveId]">): Promise<Metadata> {
  const { liveId } = await params;
  const live = getLive(liveId);
  if (!live) return {};
  return {
    title: `${live.eventName} (${formatDateShort(live.date)})`,
    description: `${formatDateShort(live.date)} ${live.venueName} でのセットリスト全${live.setlist.length}曲。`,
  };
}

export default async function LivePage({
  params,
}: PageProps<"/lives/[liveId]">) {
  const { liveId } = await params;
  const live = getLive(liveId);
  if (!live) notFound();

  const prev = live.prevLiveId ? getLive(live.prevLiveId) : null;
  const next = live.nextLiveId ? getLive(live.nextLiveId) : null;
  const firstCount = live.setlist.filter((s) => s.isFirstPerformance).length;

  return (
    <div className="pt-8">
      <nav className="text-xs text-muted" aria-label="パンくず">
        <Link href="/" className="hover:text-accent-strong hover:underline">
          ライブ履歴
        </Link>
        <span className="mx-1.5">/</span>
        <span>{formatDateShort(live.date)}</span>
      </nav>

      <header className="mt-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <time className="font-mono tabular-nums">{formatDate(live.date)}</time>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">
            第{live.eventId}回出演
          </span>
        </div>
        <h1 className="mt-1.5 text-2xl font-bold leading-snug sm:text-3xl">
          {live.eventName}
        </h1>
        {live.venueName && (
          <p className="mt-1.5">
            <Link
              href={`/venues/${venueSlug(live.venueName)}`}
              className="inline-flex items-center gap-1 text-sm text-muted underline-offset-4 hover:text-accent-strong hover:underline"
            >
              <svg aria-hidden width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 21s-7-5.1-7-11a7 7 0 1 1 14 0c0 5.9-7 11-7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              {live.venueName}
            </Link>
          </p>
        )}
        {live.memo && (
          <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted">
            {live.memo}
          </p>
        )}
      </header>

      <section className="mt-6">
        <h2 className="mb-2 flex items-baseline gap-2 text-lg font-bold">
          セットリスト
          <span className="text-xs font-normal text-muted">
            {live.setlist.length}曲
            {firstCount > 0 && ` ・ 初披露${firstCount}曲`}
            {live.youtubeCount > 0 && ` ・ 動画${live.youtubeCount}本`}
          </span>
        </h2>
        <SetlistView setlist={live.setlist} />
      </section>

      <nav className="mt-8 grid grid-cols-2 gap-3" aria-label="前後のライブ">
        {prev ? (
          <Link
            href={`/lives/${prev.id}`}
            className="group rounded-xl border border-border bg-surface p-3 transition-colors hover:border-accent"
          >
            <span className="text-xs text-muted">← 前のライブ</span>
            <span className="mt-0.5 block truncate text-sm font-medium group-hover:text-accent-strong">
              {prev.eventName}
            </span>
            <span className="text-xs text-muted">{formatDateShort(prev.date)}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/lives/${next.id}`}
            className="group rounded-xl border border-border bg-surface p-3 text-right transition-colors hover:border-accent"
          >
            <span className="text-xs text-muted">次のライブ →</span>
            <span className="mt-0.5 block truncate text-sm font-medium group-hover:text-accent-strong">
              {next.eventName}
            </span>
            <span className="text-xs text-muted">{formatDateShort(next.date)}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}

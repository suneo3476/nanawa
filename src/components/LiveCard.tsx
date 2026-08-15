import Link from "next/link";
import type { LiveDetail } from "@/lib/types";
import { formatDate } from "@/lib/format";

/**
 * ライブ一覧カード。ライブ詳細へのリンクで、セットリストの曲名が
 * その場で読める(=「この曲やったのはどのライブ?」に一覧で答える)。
 */
export function LiveCard({
  live,
  highlightSongIds,
}: {
  live: LiveDetail;
  highlightSongIds?: Set<string>;
}) {
  return (
    <Link
      href={`/lives/${live.id}`}
      className="group block rounded-xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-md"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <time className="font-mono text-sm tabular-nums text-muted">
          {formatDate(live.date)}
        </time>
        <span className="text-xs text-muted">第{live.eventId}回出演</span>
        {live.youtubeCount > 0 && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted">
            <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-accent">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
            動画 {live.youtubeCount}
          </span>
        )}
      </div>
      <h3 className="mt-1 font-semibold leading-snug group-hover:text-accent-strong">
        {live.eventName}
      </h3>
      {live.venueName && (
        <p className="mt-0.5 text-sm text-muted">{live.venueName}</p>
      )}
      {live.setlist.length > 0 && (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
          {live.setlist.map((s, i) => (
            <span key={`${s.songId}-${s.order}`}>
              {i > 0 && <span className="mx-1 text-border">/</span>}
              <span
                className={
                  highlightSongIds?.has(s.songId)
                    ? "rounded bg-accent-soft px-1 py-0.5 font-medium text-accent-strong"
                    : undefined
                }
              >
                {s.songTitle}
              </span>
            </span>
          ))}
        </p>
      )}
    </Link>
  );
}

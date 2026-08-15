import Link from "next/link";
import type { SetlistEntry } from "@/lib/types";
import { YouTubeEmbed } from "./YouTubeEmbed";

export function SetlistView({ setlist }: { setlist: SetlistEntry[] }) {
  if (setlist.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface p-4 text-sm text-muted">
        セットリストの記録が残っていません。
      </p>
    );
  }

  const hasMedley = setlist.some((s) => s.type === "medley");

  return (
    <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {setlist.map((item) => (
        <li key={`${item.songId}-${item.order}`} className="px-4 py-3">
          <div className="flex items-baseline gap-3">
            <span className="w-6 shrink-0 text-right font-mono text-sm tabular-nums text-muted">
              {item.order}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Link
                  href={`/songs/${item.songId}`}
                  className="font-medium underline-offset-4 hover:text-accent-strong hover:underline"
                >
                  {item.songTitle}
                </Link>
                {item.type === "medley" && (
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-muted">
                    メドレー
                  </span>
                )}
                {item.isFirstPerformance && (
                  <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[11px] font-medium text-accent-strong">
                    初披露
                  </span>
                )}
              </div>
              {item.memo && item.type !== "medley" && (
                <p className="mt-0.5 text-xs text-muted">{item.memo}</p>
              )}
              {item.youtubeUrl && (
                <div className="mt-1.5">
                  <YouTubeEmbed
                    url={item.youtubeUrl}
                    title={`${item.songTitle} の演奏動画`}
                  />
                </div>
              )}
            </div>
          </div>
        </li>
      ))}
      {hasMedley && (
        <li className="bg-surface-2/50 px-4 py-2 text-xs text-muted">
          「メドレー」の曲はメドレー形式で続けて演奏されました。
        </li>
      )}
    </ol>
  );
}

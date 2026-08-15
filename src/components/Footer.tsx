import { getSummary } from "@/lib/data";
import { formatDateShort } from "@/lib/format";

export function Footer() {
  const summary = getSummary();
  return (
    <footer className="border-t border-border bg-surface-2/60">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-6 text-xs text-muted sm:px-6">
        <p>
          aikoコピーバンド「七輪」活動アーカイブ ・ {formatDateShort(summary.firstDate)} 〜{" "}
          {formatDateShort(summary.lastDate)}
        </p>
        <p>
          ライブ {summary.liveCount}回 / 演奏曲 {summary.songCount}曲 / 会場{" "}
          {summary.venueCount}ヶ所 / 演奏動画 {summary.youtubeCount}本
        </p>
      </div>
    </footer>
  );
}

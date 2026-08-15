"use client";

import { useState } from "react";
import { parseYouTubeUrl, youtubeEmbedUrl } from "@/lib/format";

/** クリックで展開する YouTube 埋め込み。start/t タイムスタンプ対応。 */
export function YouTubeEmbed({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  const ref = parseYouTubeUrl(url);
  if (!ref) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent-strong"
      >
        <PlayIcon />
        演奏動画を見る
        {ref.start ? <span className="text-muted">({fmtTime(ref.start)}〜)</span> : null}
      </button>
    );
  }

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-border">
      <div className="relative aspect-video">
        <iframe
          src={`${youtubeEmbedUrl(ref)}&autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function PlayIcon() {
  return (
    <svg
      aria-hidden
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-accent"
    >
      <path d="M8 5.5v13l11-6.5z" />
    </svg>
  );
}

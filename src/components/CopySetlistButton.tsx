"use client";

import { useState } from "react";
import type { LiveDetail } from "@/lib/types";
import { formatDate } from "@/lib/format";

/** セトリをLINEなどに貼れるテキストとしてコピーする */
export function CopySetlistButton({ live }: { live: LiveDetail }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const lines = live.setlist.map(
      (s) =>
        `${s.order}. ${s.songTitle}${s.type === "medley" ? "(メドレー)" : ""}${
          s.isFirstPerformance ? " ★初披露" : ""
        }`,
    );
    const text = [
      `🔥 七輪 セットリスト`,
      `${live.eventName}`,
      `${formatDate(live.date)}${live.venueName ? ` @ ${live.venueName}` : ""}`,
      "",
      ...lines,
      "",
      window.location.href,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent-strong"
    >
      {copied ? (
        "コピーしました ✓"
      ) : (
        <>
          <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
          セトリをコピー
        </>
      )}
    </button>
  );
}

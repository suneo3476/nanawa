"use client";

import { useState } from "react";

/**
 * ページ見出しの横に置く「使い方」ポップオーバー。
 * 説明文を本文にべた書きせず、必要な人だけが読めるようにする。
 */
export function InfoTip({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label="このページの使い方"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={`flex h-6 w-6 items-center justify-center rounded-full border text-[13px] font-semibold transition-colors ${
          open
            ? "border-accent bg-accent-soft text-accent-strong"
            : "border-border bg-surface text-muted hover:border-accent hover:text-accent-strong"
        }`}
      >
        ?
      </button>
      {open && (
        <>
          <span
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <span
            role="note"
            className="absolute top-8 left-0 z-50 block w-72 max-w-[80vw] rounded-xl border border-border bg-surface p-3.5 text-xs leading-relaxed text-muted shadow-xl"
          >
            {children}
          </span>
        </>
      )}
    </span>
  );
}

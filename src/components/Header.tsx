"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { SearchEntry } from "@/lib/search-index";
import { SearchPalette } from "./SearchPalette";

const NAV = [
  { href: "/", label: "ライブ" },
  { href: "/songs", label: "楽曲" },
  { href: "/venues", label: "会場" },
  { href: "/stats", label: "統計" },
  { href: "/picker", label: "選曲" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/" || pathname.startsWith("/lives");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header({ searchIndex }: { searchIndex: SearchEntry[] }) {
  const pathname = usePathname();
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-1 px-2.5 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1.5 font-bold tracking-wide sm:gap-2"
        >
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]"
          />
          <span className="text-sm whitespace-nowrap sm:text-base">
            七輪ライブラリー
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-0 sm:gap-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-1.5 py-1.5 text-[13px] whitespace-nowrap transition-colors sm:px-3 sm:text-sm ${
                  active
                    ? "bg-accent-soft font-semibold text-accent-strong"
                    : "text-muted hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface px-1.5 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-foreground sm:px-2"
          aria-label="検索"
        >
          <svg
            aria-hidden
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="hidden sm:inline">検索</span>
          <kbd className="hidden rounded border border-border bg-surface-2 px-1 font-sans text-[10px] text-muted sm:inline">
            ⌘K
          </kbd>
        </button>
      </div>

      <SearchPalette
        index={searchIndex}
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
      />
    </header>
  );
}

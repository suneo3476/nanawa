"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SearchEntry } from "@/lib/search-index";
import { matchesQuery } from "@/lib/normalize";

const TYPE_LABEL = { song: "曲", live: "ライブ", venue: "会場" } as const;
const TYPE_ORDER = { song: 0, live: 1, venue: 2 } as const;
const MAX_RESULTS = 20;

export function SearchPalette({
  index,
  open,
  onOpenChange,
}: {
  index: SearchEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // ⌘K / Ctrl+K でトグル、Esc で閉じる
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;
  // 開くたびにマウントし直すことで query/cursor が初期化される
  return <PaletteBody index={index} onClose={() => onOpenChange(false)} />;
}

function PaletteBody({
  index,
  onClose,
}: {
  index: SearchEntry[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) {
      // 空クエリ時はおすすめ: 定番曲・最近のライブ・よく出る会場
      // (インデックスは種別ごとに定番順/新しい順/回数順で並んでいる)
      const pick = (type: SearchEntry["type"], n: number) =>
        index.filter((e) => e.type === type).slice(0, n);
      return [...pick("song", 5), ...pick("live", 3), ...pick("venue", 2)];
    }
    return index
      .filter((e) => matchesQuery(e.norm, q))
      .sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type])
      .slice(0, MAX_RESULTS);
  }, [index, query]);

  // 結果が減った場合に備えてカーソルは描画時にクランプする
  const activeCursor = Math.min(cursor, Math.max(0, results.length - 1));

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor(Math.min(activeCursor + 1, results.length - 1));
      scrollCursorIntoView();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor(Math.max(activeCursor - 1, 0));
      scrollCursorIntoView();
    } else if (e.key === "Enter" && results[activeCursor]) {
      e.preventDefault();
      go(results[activeCursor].href);
    }
  };

  const scrollCursorIntoView = () => {
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector('[data-cursor="true"]')
        ?.scrollIntoView({ block: "nearest" });
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="検索"
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setCursor(0);
          }}
          onKeyDown={onInputKeyDown}
          placeholder="曲名・イベント名・会場名・年 で検索…"
          className="w-full border-b border-border bg-transparent px-4 py-3.5 text-base outline-none placeholder:text-muted"
          aria-label="検索キーワード"
        />
        <ul ref={listRef} className="max-h-[50vh] overflow-y-auto p-1.5">
          {query.trim() !== "" && results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted">
              「{query}」に一致する曲・ライブ・会場はありません
            </li>
          )}
          {query.trim() === "" && results.length > 0 && (
            <li className="px-3 pt-2 pb-1 text-[11px] text-muted">
              おすすめ — ひらがな・カタカナどちらでも検索できます
            </li>
          )}
          {results.map((r, i) => (
            <li key={r.href}>
              <button
                type="button"
                data-cursor={i === activeCursor}
                onClick={() => go(r.href)}
                onMouseEnter={() => setCursor(i)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left ${
                  i === activeCursor ? "bg-accent-soft" : ""
                }`}
              >
                <span
                  className={`w-12 shrink-0 rounded px-1.5 py-0.5 text-center text-xs font-medium ${
                    r.type === "song"
                      ? "bg-accent-soft text-accent-strong"
                      : "bg-surface-2 text-muted"
                  }`}
                >
                  {TYPE_LABEL[r.type]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {r.title}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {r.sub}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

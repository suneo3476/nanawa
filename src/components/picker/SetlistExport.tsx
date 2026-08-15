"use client";

import { useEffect, useMemo, useState } from "react";
import type { Draft, PickerSong } from "./types";

/**
 * できたセトリを、このアプリのライブ記録データ(data/*.yml)に貼れる形で書き出す。
 * 「選曲会議で決めたセトリ」→「ライブ後の記録」への橋渡し。
 */
export function SetlistExport({
  draft,
  songById,
  nextLiveNumber,
  nextEventId,
  onClose,
}: {
  draft: Draft;
  songById: Map<string, PickerSong>;
  nextLiveNumber: number;
  nextEventId: number;
  onClose: () => void;
}) {
  const [confirmedOnly, setConfirmedOnly] = useState(
    draft.items.some((i) => i.confirmed),
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const liveId = `live${String(nextLiveNumber).padStart(3, "0")}`;
  const items = useMemo(
    () => (confirmedOnly ? draft.items.filter((i) => i.confirmed) : draft.items),
    [draft.items, confirmedOnly],
  );

  const missingDate = !draft.date;
  const yaml = useMemo(() => {
    const esc = (v: string) => (v.includes(": ") || v.includes("#") ? `'${v}'` : v);
    const livesBlock = [
      "# ▼ data/lives.yml の先頭に追記",
      `- id: ${liveId}`,
      `  eventId: ${nextEventId}`,
      `  date: '${draft.date || "YYYY-MM-DD"}'`,
      `  eventName: ${esc(draft.eventName || "イベント名")}`,
      `  venueName: ${draft.venueName ? esc(draft.venueName) : "''"}`,
      `  memo: ${draft.memo ? esc(draft.memo) : "''"}`,
    ].join("\n");
    const setlistBlock = [
      "# ▼ data/setlists.yml の先頭に追記",
      ...items.flatMap((item, i) => {
        const s = songById.get(item.songId);
        return [
          `- liveId: ${liveId}`,
          `  songId: ${item.songId}${s ? `   # ${s.title}` : ""}`,
          `  order: ${i + 1}`,
          "  type: individual",
          "  memo: ''",
          "  youtubeUrl: ''",
        ];
      }),
    ].join("\n");
    return `${livesBlock}\n\n${setlistBlock}\n`;
  }, [liveId, nextEventId, draft, items, songById]);

  const copy = async () => {
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([yaml], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${liveId}-setlist.yml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[8vh] backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="ライブ記録用に書き出す"
    >
      <div
        className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-bold">ライブ記録用に書き出す</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="rounded p-1 text-muted hover:text-foreground"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <p className="text-xs leading-relaxed text-muted">
            ライブが終わったら、この内容を{" "}
            <code className="rounded bg-surface-2 px-1">data/lives.yml</code> と{" "}
            <code className="rounded bg-surface-2 px-1">data/setlists.yml</code>{" "}
            に貼り付けて <code className="rounded bg-surface-2 px-1">npm run build</code>{" "}
            すると、このアプリのライブ履歴に加わります。IDは現在のデータから自動採番しています。
          </p>

          {missingDate && (
            <p className="mt-2 rounded-lg bg-accent-soft px-2.5 py-1.5 text-[11px] text-accent-strong">
              開催日が未入力です。書き出し後に日付(YYYY-MM-DD)を埋めてください。
            </p>
          )}

          {draft.items.some((i) => i.confirmed) && (
            <label className="mt-3 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={confirmedOnly}
                onChange={(e) => setConfirmedOnly(e.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--accent)]"
              />
              確定した曲だけを書き出す({draft.items.filter((i) => i.confirmed).length}曲)
            </label>
          )}

          <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-background p-3 font-mono text-[11px] leading-relaxed">
            {yaml}
          </pre>
        </div>

        <div className="flex gap-2 border-t border-border px-4 py-3">
          <button
            type="button"
            onClick={copy}
            className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
          >
            {copied ? "コピーしました ✓" : "コピー"}
          </button>
          <button
            type="button"
            onClick={download}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            .yml で保存
          </button>
        </div>
      </div>
    </div>
  );
}

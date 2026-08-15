"use client";

import { useState } from "react";
import { formatDateShort } from "@/lib/format";
import type { Draft } from "./types";

/**
 * どのライブのセトリかを示すヘッダー。
 * ふだんは1行のサマリーだけを見せ、押したときだけ入力欄を開く。
 */
export function LiveInfoCard({
  draft,
  onChange,
}: {
  draft: Draft;
  onChange: (patch: Partial<Draft>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const hasInfo = draft.eventName || draft.date || draft.venueName;

  return (
    <div className="border-b border-border px-4 py-2.5">
      <button
        type="button"
        onClick={() => setEditing(!editing)}
        aria-expanded={editing}
        className="flex w-full items-center gap-2 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold">
            {draft.eventName || (
              <span className="font-normal text-muted">ライブ未設定</span>
            )}
          </span>
          {hasInfo && (
            <span className="block truncate text-[11px] text-muted">
              {[
                draft.date ? formatDateShort(draft.date) : "日付未定",
                draft.venueName,
              ]
                .filter(Boolean)
                .join(" ・ ")}
            </span>
          )}
        </span>
        <span className="shrink-0 text-[11px] text-muted underline underline-offset-2">
          {editing ? "閉じる" : "編集"}
        </span>
      </button>

      {editing && (
        <div className="mt-2 space-y-1.5">
          <input
            value={draft.eventName}
            onChange={(e) => onChange({ eventName: e.target.value })}
            placeholder="イベント名 (例: 第62回J-POP祭)"
            aria-label="イベント名"
            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-accent"
          />
          <div className="flex gap-1.5">
            <input
              type="date"
              value={draft.date}
              onChange={(e) => onChange({ date: e.target.value })}
              aria-label="開催日"
              className="w-[45%] rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-accent"
            />
            <input
              value={draft.venueName}
              onChange={(e) => onChange({ venueName: e.target.value })}
              placeholder="会場名"
              aria-label="会場名"
              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-accent"
            />
          </div>
        </div>
      )}
    </div>
  );
}

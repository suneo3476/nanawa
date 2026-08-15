"use client";

import type { Member } from "./types";

/**
 * メンバーごとの希望曲。全員の希望が最低1曲は入っている状態を目指すための可視化。
 * 人数は可変(初期値7人)。
 */
export function MembersPanel({
  members,
  pickedIds,
  songTitle,
  wishMemberId,
  onSetWishMember,
  onRename,
  onAdd,
  onRemove,
  onRemoveWish,
}: {
  members: Member[];
  pickedIds: Set<string>;
  songTitle: (songId: string) => string;
  wishMemberId: string | null;
  onSetWishMember: (id: string | null) => void;
  onRename: (id: string, name: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onRemoveWish: (memberId: string, songId: string) => void;
}) {
  const withWishes = members.filter((m) => m.wishes.length > 0);
  const satisfied = withWishes.filter((m) =>
    m.wishes.some((w) => pickedIds.has(w)),
  );

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-bold">メンバーの希望曲</h2>
        <span className="text-[11px] text-muted">
          {withWishes.length > 0
            ? `${satisfied.length}/${withWishes.length}人 満たせています`
            : `${members.length}人`}
        </span>
      </div>

      {wishMemberId && (
        <p className="mt-2 rounded-lg bg-accent-soft px-2.5 py-1.5 text-[11px] leading-relaxed text-accent-strong">
          「{members.find((m) => m.id === wishMemberId)?.name}」の希望曲を登録中です。曲一覧の
          ♥ ボタンで登録し、終わったら下の「登録を終わる」を押してください。
        </p>
      )}

      <ul className="mt-2.5 space-y-1.5">
        {members.map((m) => {
          const ok = m.wishes.some((w) => pickedIds.has(w));
          const active = wishMemberId === m.id;
          return (
            <li
              key={m.id}
              className={`rounded-lg border px-2 py-1.5 transition-colors ${
                active ? "border-accent bg-accent-soft/40" : "border-border bg-surface-2"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  title={
                    m.wishes.length === 0
                      ? "希望曲が未登録"
                      : ok
                        ? "希望曲が候補に入っています"
                        : "希望曲がまだ候補に入っていません"
                  }
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    m.wishes.length === 0
                      ? "bg-border"
                      : ok
                        ? "bg-accent"
                        : "bg-[#c0504d]"
                  }`}
                />
                <input
                  value={m.name}
                  onChange={(e) => onRename(m.id, e.target.value)}
                  aria-label="メンバー名"
                  className="min-w-0 flex-1 rounded bg-transparent px-1 py-0.5 text-sm font-medium outline-none focus:bg-background"
                />
                <span className="shrink-0 text-[10px] text-muted">
                  希望{m.wishes.length}
                </span>
                <button
                  type="button"
                  onClick={() => onSetWishMember(active ? null : m.id)}
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                    active
                      ? "bg-accent text-white"
                      : "text-accent-strong hover:bg-accent-soft"
                  }`}
                >
                  {active ? "登録を終わる" : "希望を登録"}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(m.id)}
                  aria-label={`${m.name}を削除`}
                  className="shrink-0 rounded p-0.5 text-muted hover:text-foreground"
                >
                  ×
                </button>
              </div>
              {m.wishes.length > 0 && (
                <ul className="mt-1 flex flex-wrap gap-1 pl-3.5">
                  {m.wishes.map((w) => (
                    <li key={w}>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] ${
                          pickedIds.has(w)
                            ? "bg-accent-soft text-accent-strong"
                            : "bg-background text-muted"
                        }`}
                      >
                        {songTitle(w)}
                        <button
                          type="button"
                          onClick={() => onRemoveWish(m.id, w)}
                          aria-label={`${songTitle(w)}を${m.name}の希望から外す`}
                          className="opacity-60 hover:opacity-100"
                        >
                          ×
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onAdd}
        className="mt-2 w-full rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent-strong"
      >
        + メンバーを追加
      </button>
    </div>
  );
}

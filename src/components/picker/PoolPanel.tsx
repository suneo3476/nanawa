"use client";

import { useMemo, useState } from "react";
import type { Season } from "@/lib/types";
import { SEASON_LABEL } from "@/components/SongBadges";
import { SongRow } from "./SongRow";
import {
  ATTR_FILTERS,
  SEASONS,
  WISH_FILTERS,
  isFilterActive,
  type AttrFilter,
  type FilterState,
  type FilteredSong,
} from "./filter";
import type { PickerAlbum, PickerSong } from "./types";

export type SortKey = "gap" | "count" | "rare" | "title" | "fit";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "gap", label: "ごぶさた順" },
  { key: "count", label: "定番順" },
  { key: "rare", label: "レア曲順" },
  { key: "title", label: "曲名順" },
];

const MAX_ROWS = 120;

export interface PoolPanelProps {
  songs: PickerSong[];
  albums: PickerAlbum[];
  /** 絞り込み済みの曲(セトリ案の提案と同じ条件) */
  filtered: FilteredSong[];
  filter: FilterState;
  onFilterChange: (next: FilterState) => void;
  sort: SortKey;
  onSortChange: (next: SortKey) => void;
  pickedIds: Set<string>;
  fitDelta: ((s: PickerSong) => number) | null;
  /** 「おすすめ順」の並べ替えに使うスコア(表示はしない) */
  sortScore: ((s: PickerSong) => number) | null;
  hasDirection: boolean;
  /** 希望登録モードのメンバー(null なら通常モード) */
  wishMember: { id: string; name: string; wishes: string[] } | null;
  wishesBySong: Map<string, string[]>;
  onToggle: (songId: string) => void;
  onToggleWish: (songId: string) => void;
  autoFocus?: boolean;
  sticky?: boolean;
}

export function PoolPanel({
  songs,
  albums,
  filtered,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  pickedIds,
  fitDelta,
  sortScore,
  hasDirection,
  wishMember,
  wishesBySong,
  onToggle,
  onToggleWish,
  autoFocus = false,
  sticky = false,
}: PoolPanelProps) {
  const [mode, setMode] = useState<"search" | "discography">("search");

  const songById = useMemo(() => new Map(songs.map((s) => [s.id, s])), [songs]);

  const toggleAttr = (key: AttrFilter) => {
    // 演奏済み/未演奏は排他(同時に選ぶと結果がゼロになるため)
    const exclusive: Partial<Record<AttrFilter, AttrFilter>> = {
      performed: "unperformed",
      unperformed: "performed",
    };
    const opposite = exclusive[key];
    const attrs = filter.attrs.includes(key)
      ? filter.attrs.filter((a) => a !== key)
      : [...filter.attrs.filter((a) => a !== opposite), key];
    onFilterChange({ ...filter, attrs });
  };

  const toggleSeason = (s: Season) =>
    onFilterChange({
      ...filter,
      seasons: filter.seasons.includes(s)
        ? filter.seasons.filter((x) => x !== s)
        : [...filter.seasons, s],
    });

  const pool = useMemo(() => {
    const bySort: Record<SortKey, (a: PickerSong, b: PickerSong) => number> = {
      // 未演奏(null)は「一度もやっていない」= 最ごぶさたとして先頭
      gap: (a, b) =>
        (b.livesSinceLast ?? Number.POSITIVE_INFINITY) -
        (a.livesSinceLast ?? Number.POSITIVE_INFINITY),
      count: (a, b) => b.playCount - a.playCount,
      rare: (a, b) => a.playCount - b.playCount,
      title: (a, b) => a.title.localeCompare(b.title, "ja"),
      fit: (a, b) => (sortScore?.(b) ?? 0) - (sortScore?.(a) ?? 0),
    };
    return [...filtered].sort(
      (a, b) =>
        bySort[sort](a.song, b.song) ||
        b.song.playCount - a.song.playCount ||
        a.song.title.localeCompare(b.song.title, "ja"),
    );
  }, [filtered, sort, sortScore]);

  return (
    <div>
      <div
        className={
          sticky
            ? "sticky top-14 z-30 bg-background/95 py-3 backdrop-blur"
            : "sticky top-0 z-10 -mx-1 bg-background px-1 py-2"
        }
      >
        <div className="mb-2 flex items-center gap-1.5">
          <ModeTab active={mode === "search"} onClick={() => setMode("search")}>
            曲から探す
          </ModeTab>
          <ModeTab
            active={mode === "discography"}
            onClick={() => setMode("discography")}
          >
            ディスコグラフィから探す
          </ModeTab>
        </div>

        {mode === "search" && (
          <>
            <input
               
              autoFocus={autoFocus}
              value={filter.query}
              onChange={(e) => onFilterChange({ ...filter, query: e.target.value })}
              placeholder="曲名・収録CD名で絞り込み"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-[15px] shadow-sm outline-none transition-colors placeholder:text-muted/70 focus:border-accent"
              aria-label="曲を検索"
            />
            <div className="no-scrollbar mt-2.5 flex items-center gap-1.5 overflow-x-auto">
              {ATTR_FILTERS.map((f) => (
                <Chip
                  key={f.key}
                  active={filter.attrs.includes(f.key)}
                  onClick={() => toggleAttr(f.key)}
                >
                  {f.label}
                </Chip>
              ))}
              <span className="mx-0.5 h-4 w-px shrink-0 bg-border" />
              {WISH_FILTERS.map((f) => (
                <Chip
                  key={f.key}
                  active={filter.attrs.includes(f.key)}
                  onClick={() => toggleAttr(f.key)}
                >
                  {f.label}
                </Chip>
              ))}
              <span className="mx-0.5 h-4 w-px shrink-0 bg-border" />
              {SEASONS.map((s) => (
                <Chip
                  key={s}
                  active={filter.seasons.includes(s)}
                  onClick={() => toggleSeason(s)}
                >
                  {SEASON_LABEL[s]}
                </Chip>
              ))}
              {isFilterActive(filter) && (
                <button
                  type="button"
                  onClick={() =>
                    onFilterChange({ query: "", attrs: [], seasons: [] })
                  }
                  className="shrink-0 rounded-full px-2 py-1 text-xs text-muted underline underline-offset-2 hover:text-foreground"
                >
                  解除
                </button>
              )}
            </div>
            <div className="no-scrollbar mt-1.5 flex items-center gap-1.5 overflow-x-auto">
              {SORTS.map((s) => (
                <Chip
                  key={s.key}
                  active={sort === s.key}
                  onClick={() => onSortChange(s.key)}
                >
                  {s.label}
                </Chip>
              ))}
              {hasDirection && (
                <Chip active={sort === "fit"} onClick={() => onSortChange("fit")}>
                  おすすめ順 ✨
                </Chip>
              )}
            </div>
          </>
        )}
      </div>

      {mode === "search" ? (
        <>
          <p className="pt-2 pb-1 text-xs text-muted" role="status">
            {pool.length}曲
            {isFilterActive(filter) && (
              <span className="ml-1 text-accent-strong">
                (絞り込み中 — セトリ案もこの範囲から作ります)
              </span>
            )}
          </p>
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
            {pool.slice(0, MAX_ROWS).map(({ song, matchedAlbum }) => (
              <SongRow
                key={song.id}
                song={song}
                matchedAlbum={matchedAlbum}
                picked={pickedIds.has(song.id)}
                fitDelta={fitDelta ? fitDelta(song) : null}
                wishedBy={wishesBySong.get(song.id)}
                wishModeMember={wishMember?.name ?? null}
                wishedByCurrent={wishMember?.wishes.includes(song.id)}
                onToggle={() => onToggle(song.id)}
                onToggleWish={() => onToggleWish(song.id)}
              />
            ))}
            {pool.length === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted">
                条件に一致する曲がありません。
              </li>
            )}
            {pool.length > MAX_ROWS && (
              <li className="bg-surface-2/50 px-4 py-2 text-center text-xs text-muted">
                他 {pool.length - MAX_ROWS} 曲 — 検索や絞り込みで対象を狭めてください
              </li>
            )}
          </ul>
        </>
      ) : (
        <DiscographyBrowser
          albums={albums}
          songById={songById}
          pickedIds={pickedIds}
          fitDelta={fitDelta}
          wishesBySong={wishesBySong}
          wishMember={wishMember}
          onToggle={onToggle}
          onToggleWish={onToggleWish}
        />
      )}
    </div>
  );
}

const CATEGORY_ORDER = ["アルバム", "シングル", "EP"];

function DiscographyBrowser({
  albums,
  songById,
  pickedIds,
  fitDelta,
  wishesBySong,
  wishMember,
  onToggle,
  onToggleWish,
}: {
  albums: PickerAlbum[];
  songById: Map<string, PickerSong>;
  pickedIds: Set<string>;
  fitDelta: ((s: PickerSong) => number) | null;
  wishesBySong: Map<string, string[]>;
  wishMember: { id: string; name: string; wishes: string[] } | null;
  onToggle: (songId: string) => void;
  onToggleWish: (songId: string) => void;
}) {
  const categories = useMemo(() => {
    const set = [...new Set(albums.map((a) => a.category))];
    return set.sort(
      (a, b) =>
        (CATEGORY_ORDER.indexOf(a) + 1 || 99) - (CATEGORY_ORDER.indexOf(b) + 1 || 99),
    );
  }, [albums]);
  const [category, setCategory] = useState(categories[0] ?? "アルバム");
  const [openAlbum, setOpenAlbum] = useState<string | null>(null);

  const shown = albums
    .filter((a) => a.category === category)
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));

  return (
    <div>
      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-2">
        {categories.map((c) => (
          <Chip
            key={c}
            active={category === c}
            onClick={() => {
              setCategory(c);
              setOpenAlbum(null);
            }}
          >
            {c}
          </Chip>
        ))}
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
        {shown.map((album) => {
          const open = openAlbum === album.id;
          return (
            <li key={album.id}>
              <button
                type="button"
                onClick={() => setOpenAlbum(open ? null : album.id)}
                aria-expanded={open}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-surface-2"
              >
                <span aria-hidden className="text-xs text-muted">
                  {open ? "▾" : "▸"}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {album.title}
                </span>
                <span className="shrink-0 text-[11px] text-muted">
                  {album.releaseDate} ・ {album.songIds.length}曲
                </span>
              </button>
              {open && (
                <ul className="divide-y divide-border border-t border-border bg-background/40">
                  {album.songIds.map((songId) => {
                    const song = songById.get(songId);
                    if (!song) return null;
                    return (
                      <SongRow
                        key={songId}
                        song={song}
                        picked={pickedIds.has(songId)}
                        fitDelta={fitDelta ? fitDelta(song) : null}
                        wishedBy={wishesBySong.get(songId)}
                        wishModeMember={wishMember?.name ?? null}
                        wishedByCurrent={wishMember?.wishes.includes(songId)}
                        onToggle={() => onToggle(songId)}
                        onToggleWish={() => onToggleWish(songId)}
                      />
                    );
                  })}
                  {album.songIds.length === 0 && (
                    <li className="px-4 py-3 text-xs text-muted">
                      収録曲のデータがありません。
                    </li>
                  )}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "bg-accent-soft text-accent-strong"
          : "text-muted hover:bg-surface-2 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-accent bg-accent-soft text-accent-strong"
          : "border-border bg-surface text-muted hover:border-accent/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

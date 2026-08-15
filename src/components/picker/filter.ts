import type { Season } from "@/lib/types";
import { matchesQuery, normalizeForSearch } from "@/lib/normalize";
import type { PickerSong } from "./types";

/** 曲の属性による絞り込み */
export type AttrFilter =
  | "single"
  | "coupling"
  | "kouhaku"
  | "tieup"
  | "ballad"
  | "performed"
  | "unperformed"
  | "wished"
  | "unmetWish";

export const ATTR_FILTERS: { key: AttrFilter; label: string }[] = [
  { key: "single", label: "シングル" },
  { key: "coupling", label: "カップリング" },
  { key: "kouhaku", label: "紅白" },
  { key: "tieup", label: "タイアップ" },
  { key: "ballad", label: "バラード" },
  { key: "performed", label: "演奏済み" },
  { key: "unperformed", label: "未演奏" },
];

export const WISH_FILTERS: { key: AttrFilter; label: string }[] = [
  { key: "wished", label: "♥ 誰かの希望" },
  { key: "unmetWish", label: "♥ まだ叶ってない希望" },
];

export const SEASONS: Season[] = ["spring", "summer", "autumn", "winter"];

export interface FilterState {
  query: string;
  attrs: AttrFilter[];
  seasons: Season[];
}

export const emptyFilter = (): FilterState => ({
  query: "",
  attrs: [],
  seasons: [],
});

export const isFilterActive = (f: FilterState) =>
  f.query.trim() !== "" || f.attrs.length > 0 || f.seasons.length > 0;

export interface FilteredSong {
  song: PickerSong;
  /** 曲名ではなく収録CD名でヒットした場合、そのCD名 */
  matchedAlbum: string | null;
}

/** 演奏状況・希望は AND、それ以外の楽曲属性は OR で扱う */
const AND_KEYS: AttrFilter[] = ["performed", "unperformed", "wished", "unmetWish"];

/**
 * 曲一覧の絞り込み。曲プールの表示とセトリ案の提案で同じ条件を使うため、
 * ここに一本化している。
 */
export function filterSongs(
  songs: PickerSong[],
  filter: FilterState,
  ctx: { wishesBySong: Map<string, string[]>; unmetWishes: Set<string> },
): FilteredSong[] {
  const test: Record<AttrFilter, (s: PickerSong) => boolean> = {
    single: (s) => s.isSingleA,
    coupling: (s) => s.isCoupling,
    kouhaku: (s) => s.kouhaku,
    tieup: (s) => !!s.tieup,
    ballad: (s) => !!s.ballad,
    performed: (s) => s.performed,
    unperformed: (s) => !s.performed,
    wished: (s) => (ctx.wishesBySong.get(s.id)?.length ?? 0) > 0,
    unmetWish: (s) => ctx.unmetWishes.has(s.id),
  };
  const orKeys = filter.attrs.filter((a) => !AND_KEYS.includes(a));
  const andKeys = filter.attrs.filter((a) => AND_KEYS.includes(a));
  const q = filter.query.trim();

  const result: FilteredSong[] = [];
  for (const song of songs) {
    if (orKeys.length > 0 && !orKeys.some((a) => test[a](song))) continue;
    if (andKeys.some((a) => !test[a](song))) continue;
    if (
      filter.seasons.length > 0 &&
      !filter.seasons.some((x) => song.seasons.includes(x))
    )
      continue;

    if (!q) {
      result.push({ song, matchedAlbum: null });
      continue;
    }
    if (matchesQuery(normalizeForSearch(song.title), q)) {
      result.push({ song, matchedAlbum: null });
      continue;
    }
    const album = song.albums.find((a) =>
      matchesQuery(normalizeForSearch(a), q),
    );
    if (album) result.push({ song, matchedAlbum: album });
  }
  return result;
}

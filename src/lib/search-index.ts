import { getAllLives, getAllSongs, getAllVenues } from "./data";
import { formatDateShort } from "./format";
import { normalizeForSearch } from "./normalize";

export interface SearchEntry {
  type: "song" | "live" | "venue";
  title: string;
  sub: string;
  href: string;
  /** 正規化済みの検索対象テキスト */
  norm: string;
}

/** ⌘K パレット用のコンパクトな全文インデックス(ビルド時生成) */
export function buildSearchIndex(): SearchEntry[] {
  // 演奏回数順に並べておくと、パレットの空クエリ時の候補がそのまま「定番順」になる
  const songs = getAllSongs()
    .filter((s) => s.playCount > 0)
    .sort((a, b) => b.playCount - a.playCount)
    .map<SearchEntry>((s) => ({
      type: "song",
      title: s.title,
      sub: `演奏 ${s.playCount}回${s.album ? ` ・ ${s.album}` : ""}`,
      href: `/songs/${s.id}/`,
      norm: normalizeForSearch(`${s.title} ${s.album}`),
    }));

  const lives = getAllLives().map<SearchEntry>((l) => ({
    type: "live",
    title: l.eventName,
    sub: `${formatDateShort(l.date)} ・ ${l.venueName || "会場不明"}`,
    href: `/lives/${l.id}/`,
    norm: normalizeForSearch(
      `${l.eventName} ${l.venueName} ${l.date} ${l.date.slice(0, 4)}年`,
    ),
  }));

  const venues = getAllVenues().map<SearchEntry>((v) => ({
    type: "venue",
    title: v.name,
    sub: `ライブ ${v.liveCount}回`,
    href: `/venues/${v.slug}/`,
    norm: normalizeForSearch(v.name),
  }));

  return [...songs, ...lives, ...venues];
}

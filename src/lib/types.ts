// データモデル: data/*.yml と1対1で対応する生レコードと、
// ビルド時に導出する集計済みモデル。

export interface Song {
  id: string;
  title: string;
  album: string;
  releaseDate: string;
  trackNumber: number | null;
  isSingle: boolean;
}

export interface Live {
  id: string;
  eventId: number;
  date: string; // YYYY-MM-DD
  eventName: string;
  venueName: string;
  memo: string;
}

export type SetlistItemType = "individual" | "medley";

export interface SetlistItem {
  liveId: string;
  songId: string;
  order: number;
  type: SetlistItemType;
  memo: string;
  youtubeUrl: string;
}

export interface Album {
  id: string;
  title: string;
  category: string; // アルバム / シングル など
  subCategory: string; // インディーズ / メジャー など
  releaseDate: string;
}

export interface AlbumTrack {
  albumId: string;
  songId: string;
  trackNumber: number;
}

// ---- 導出モデル ----

export interface SetlistEntry extends SetlistItem {
  songTitle: string;
  /** このライブがその曲の初披露かどうか */
  isFirstPerformance: boolean;
}

export interface LiveDetail extends Live {
  year: number;
  setlist: SetlistEntry[];
  youtubeCount: number;
  prevLiveId: string | null; // 日付順で1つ前(過去)のライブ
  nextLiveId: string | null;
}

export interface SongPerformance {
  liveId: string;
  date: string;
  eventName: string;
  venueName: string;
  order: number;
  setlistLength: number;
  type: SetlistItemType;
  memo: string;
  youtubeUrl: string;
}

export interface AlbumAppearance {
  albumId: string;
  albumTitle: string;
  category: string;
  subCategory: string;
  releaseDate: string;
  trackNumber: number;
}

export type Tempo = "up" | "mid" | "slow";
/** 知名度: 1=有名(シングル表題 or 紅白) / 2=タイアップあり / 3=コア */
export type FameTier = 1 | 2 | 3;
/** 季節タグ(aiko公式Spotifyプレイリスト由来) */
export type Season = "spring" | "summer" | "autumn" | "winter";

export interface SongDetail extends Song {
  /** 演奏特性(data/song_attributes.yml)。未定義なら null */
  tempo: Tempo | null;
  ballad: boolean | null;
  /** 紅白で歌唱したことがあるか */
  kouhaku: boolean;
  /** タイアップの内容(ドラマ/CM名など)。無ければ null */
  tieup: string | null;
  bpm: number | null;
  /** シングル/EPの表題曲(1曲目)か */
  isSingleA: boolean;
  /** シングル/EPのカップリング曲(2曲目以降)か */
  isCoupling: boolean;
  seasons: Season[];
  fameTier: FameTier;
  playCount: number;
  firstPerformance: SongPerformance | null;
  lastPerformance: SongPerformance | null;
  /** 年 -> 演奏回数 */
  yearCounts: Record<number, number>;
  performances: SongPerformance[]; // 新しい順
  appearsOn: AlbumAppearance[];
  coPerformed: { songId: string; title: string; count: number }[];
  youtubeCount: number;
}

export interface Venue {
  /** URLに使うスラッグ (venue名のencodeURIComponent) */
  slug: string;
  name: string;
  liveCount: number;
  liveIds: string[];
  firstDate: string;
  lastDate: string;
}

export interface ArchiveSummary {
  liveCount: number;
  songCount: number;
  venueCount: number;
  firstDate: string;
  lastDate: string;
  youtubeCount: number;
  years: number[]; // 活動があった年(昇順)
}

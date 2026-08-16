import type { FameTier, Season, Tempo } from "@/lib/types";

export interface PickerSong {
  id: string;
  title: string;
  albums: string[];
  releaseDate: string;
  playCount: number;
  performed: boolean;
  lastDate: string;
  /** 最終演奏以降のライブ本数。未演奏なら null */
  livesSinceLast: number | null;
  tempo: Tempo | null;
  ballad: boolean | null;
  bpm: number | null;
  isSingleA: boolean;
  isCoupling: boolean;
  kouhaku: boolean;
  tieup: string | null;
  seasons: Season[];
  fameTier: FameTier;
}

export interface PickerAlbum {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  releaseDate: string;
  songIds: string[];
}

/** セトリの1曲 */
export interface DraftItem {
  songId: string;
  /** 確定した曲か(仮候補と区別する) */
  confirmed: boolean;
}

export interface Member {
  id: string;
  name: string;
  /** 希望曲の songId */
  wishes: string[];
}

/** 1本のライブに対応するセトリ案 */
export interface Draft {
  id: string;
  eventName: string;
  date: string;
  venueName: string;
  memo: string;
  items: DraftItem[];
  members: Member[];
  tempoDir: string;
  fameDir: string;
}

// src/types/song.ts

export type Song = {
  songId: string;          // 曲ID
  title: string;           // 曲名
  album: string;           // アルバム名
  releaseDate: string;     // リリース日
  
  // 拡張情報
  trackNumber?: number;          // トラック番号
  isSingle?: boolean;            // シングル曲かどうか
  albumCategory?: string;        // アルバムカテゴリ（アルバム、シングル、ベスト）
  
  // リリース履歴
  firstRelease?: {
    album: string;
    releaseDate: string;
    category: string;           // アルバム/シングル/ベスト
    subCategory: string;        // メジャー/インディーズなど
  };
  
  originalAlbum?: string;       // 初収録オリジナルアルバム
  appearsOn?: string[];         // 収録作品リスト
  
  // 演奏情報（API処理時のみ）
  performances?: {
    count: number;              // 総演奏回数
    firstPerformance?: {        // 初演奏
      liveId: string;
      date: string;
      liveName: string;
    };
    lastPerformance?: {         // 最終演奏
      liveId: string;
      date: string;
      liveName: string;
    };
  };
}
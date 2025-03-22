// src/types/song.ts
export type Song = {
  id: string;          // 曲ID (e.g., song001)
  title: string;       // 曲名
  album: string;       // 主アルバム名
  releaseDate: string; // リリース日
  trackNumber: number; // トラック番号
  isSingle: boolean;   // シングル曲かどうか
  
  // API処理時のみの拡張プロパティ
  performances?: {
    count: number;     // 総演奏回数
    firstPerformance?: {
      liveId: string;
      date: string;
      liveName: string;
    };
    lastPerformance?: {
      liveId: string;
      date: string;
      liveName: string;
    };
  };
};
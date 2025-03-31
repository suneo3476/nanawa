// src/types/live.ts
export type Live = {
  id: string;          // ライブID (e.g., live001)
  eventId: number;     // 元のイベントID
  date: string;        // 開催日 (YYYY-MM-DD format)
  eventName: string;   // イベント名
  venueName: string;   // 会場名
  memo?: string;       // メモ（オプション）
  // API拡張データ（レスポンス返却時のみ）
  setlist?: Array<{    // セットリスト情報（簡易版）
    songId: string;
    title: string;
    order: number;
    memo?: string;
    youtubeUrl?: string; // YouTube URL（オプション）
  }>;
  songCount?: number;  // 演奏曲数
};
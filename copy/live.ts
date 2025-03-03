// src/types/live.ts

export type Live = {
  liveId: string;      // ライブID (format: live_XXX where XXX is the event ID)
  name: string;        // ライブ名/イベント名
  date: string;        // 開催日 (YYYY-MM-DD format)
  venue: string;       // 会場
  memo?: string;       // ライブメモ（オプション）
  
  // API拡張データ（レスポンス返却時のみ）
  eventId?: number;    // 元のイベントID（数値）
  setlist?: Array<{    // セットリスト情報（簡易版）
    songId: string;
    title: string;
    order: number;
    memo?: string;
  }>;
  songCount?: number;  // 演奏曲数
};
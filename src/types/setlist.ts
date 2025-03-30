// src/types/setlist.ts
export type SetlistItem = {
  liveId: string;      // ライブID
  songId: string;      // 曲ID
  order: number;       // 演奏順
  type: string;        // 形態（'individual'/'medley'）
  memo: string;        // メモ
  youtubeUrl?: string; // YouTube URL（オプション）
  
  // 表示用の拡張情報（APIレスポンス用）
  songTitle?: string;  // 曲名
  albumName?: string;  // アルバム名
};
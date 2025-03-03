// src/types/setlist.ts

export type SetlistItem = {
  liveId: string;      // ライブID（ライブ情報の参照）
  songId: string;      // 曲ID（楽曲マスタの参照）
  order: number;       // 演奏順
  memo: string;        // その曲の演奏メモ（メドレー情報など）
  
  // 表示用の拡張情報（APIレスポンス用）
  songTitle?: string;  // 曲名
  albumName?: string;  // アルバム名
  isSingle?: boolean;  // シングル曲かどうか
  type?: 'individual' | 'medley';  // 形態（個別/メドレー）
};
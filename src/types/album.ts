// src/types/album.ts
export type Album = {
  id: string;          // アルバムID (e.g., album001)
  title: string;       // アルバム名
  category: string;    // カテゴリ（アルバム/シングル）
  subCategory: string; // サブカテゴリ（メジャー/インディーズ/ベスト）
  releaseDate: string; // リリース日
};
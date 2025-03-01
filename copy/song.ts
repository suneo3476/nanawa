// src/types/song.ts

export type Song = {
  songId: string;
  title: string;
  album: string;
  releaseDate: string;
  
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
}
export type SetlistItem = {
  liveId: string;      // ライブID（ライブ情報の参照）
  order: number;       // 演奏順
  songId: string;      // 曲ID（楽曲マスタの参照）
  memo: string;        // その曲の演奏メモ
}

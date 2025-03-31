// src/utils/check-links.ts

import { loadLivesData, loadSongsAndSetlists, getAllLiveIds, getAllSongIds } from '../src/utils/static-data-loader';

export async function checkLinks() {
  // 全ライブIDと楽曲IDを取得
  const liveIds = getAllLiveIds().map(x => x.liveId);
  const songIds = (await getAllSongIds()).map(x => x.songId);
  
  // セットリスト内のリンク整合性をチェック
  const { setlists } = await loadSongsAndSetlists();
  
  // 無効なライブIDを持つセットリストアイテム
  const invalidLiveLinks = setlists.filter(item => !liveIds.includes(item.liveId));
  
  // 無効な楽曲IDを持つセットリストアイテム
  const invalidSongLinks = setlists.filter(item => !songIds.includes(item.songId));
  
  return {
    invalidLiveLinks,
    invalidSongLinks,
    isValid: invalidLiveLinks.length === 0 && invalidSongLinks.length === 0
  };
}
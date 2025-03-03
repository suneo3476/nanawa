// src/utils/data-converter.ts

import type { Live } from '@/types/live';
import type { Song } from '@/types/song';
import type { SetlistItem } from '@/types/setlist';
import { enrichSongData, analyzeSongReleaseHistory } from './song-enricher';

/**
 * CSVデータをライブ情報に変換する
 * 更新版：ライブIDをデータから取得
 */
export function parseLiveHistory(liveHistoryText: string): Live[] {
  const lives: Live[] = [];
  const lines = liveHistoryText.split('\n').filter(line => line.trim());
  
  // ヘッダー行をスキップするフラグ
  let skipHeader = false;
  
  // 先頭行が「出演イベントID」を含むかチェック
  if (lines.length > 0 && lines[0].includes('出演イベントID')) {
    skipHeader = true;
  }
  
  for (let i = 0; i < lines.length; i++) {
    // ヘッダー行をスキップ
    if (i === 0 && skipHeader) continue;
    
    const line = lines[i];
    // "出演イベントID	日付	イベント名＠会場名" の形式を解析
    const parts = line.split('\t');
    
    if (parts.length >= 3) {
      const eventId = parts[0].trim();
      const date = parts[1].trim();
      const eventVenue = parts[2].trim();
      
      // "イベント名@会場名" を分割
      const match = eventVenue.match(/(.*?)@(.*)/);
      if (match) {
        const [, name, venue] = match;
        
        lives.push({
          liveId: `live_${eventId}`, // IDを直接使用
          date: formatDate(date), // YYYY/MM/DD -> YYYY-MM-DD
          name: name.trim(),
          venue: venue.trim(),
          memo: parts[3] ? parts[3].trim() : undefined
        });
      }
    }
  }
  
  return lives;
}

/**
 * セットリスト履歴からセットリスト情報と楽曲情報を抽出
 * 更新版：イベントIDを使用して対応するライブを特定
 */
export async function parseSetlistHistory(
  setlistText: string,
  lives: Live[]
): Promise<{ setlists: SetlistItem[], songs: Song[] }> {
  const setlists: SetlistItem[] = [];
  const songsMap = new Map<string, Song>();
  
  const lines = setlistText.split('\n').filter(line => line.trim());
  let songId = 1;
  
  // ヘッダー行をスキップするフラグ
  let skipHeader = false;
  
  // 先頭行が「出演イベントID」を含むかチェック
  if (lines.length > 0 && lines[0].includes('出演イベントID')) {
    skipHeader = true;
  }
  
  // IDベースのライブマッピングを作成
  const liveIdMap = new Map<string, string>();
  lives.forEach(live => {
    // live_XXXの形式からXXXを抽出
    const idMatch = live.liveId.match(/live_(\d+)/);
    if (idMatch && idMatch[1]) {
      liveIdMap.set(idMatch[1], live.liveId);
    }
  });
  
  for (let i = skipHeader ? 1 : 0; i < lines.length; i++) {
    const line = lines[i];
    // "出演イベントID	イベント名＠会場名	曲名	演奏順	形態" の形式を解析
    const parts = line.split('\t');
    
    if (parts.length >= 5) {
      const eventId = parts[0].trim();
      const eventVenue = parts[1].trim();
      const songTitle = parts[2].trim();
      const orderStr = parts[3].trim();
      const type = parts[4].trim();
      
      // イベントIDに対応するライブIDを取得
      const liveId = liveIdMap.get(eventId);
      
      if (!liveId) {
        console.warn(`対応するライブが見つかりません: イベントID="${eventId}"`);
        continue;
      }
      
      // 楽曲を検索または作成
      let currentSongId: string | undefined;
      
      // 既存の同じタイトルの曲を探す
      for (const [id, song] of songsMap.entries()) {
        if (song.title === songTitle) {
          currentSongId = id;
          break;
        }
      }
      
      // 新しい曲を作成
      if (!currentSongId) {
        currentSongId = `song_${String(songId).padStart(3, '0')}`;
        songsMap.set(currentSongId, {
          songId: currentSongId,
          title: songTitle,
          album: '', // 後で補完
          releaseDate: ''
        });
        songId++;
      }
      
      // セットリストアイテムを作成
      setlists.push({
        liveId,
        songId: currentSongId,
        order: parseInt(orderStr),
        memo: type === 'メドレー' ? 'メドレー形式で演奏' : ''
      });
    }
  }
  
  // 楽曲情報を補完
  let songs = Array.from(songsMap.values());
  
  // 新しい楽曲エンリッチャーを使用（非同期処理）
  try {
    // まずはaikoディスコグラフィデータを使用して基本情報を補完
    songs = await enrichSongData(songs);
    
    // さらに詳細なリリース履歴分析を行う
    songs = await analyzeSongReleaseHistory(songs);
  } catch (error) {
    console.error('Failed to enrich song data:', error);
    // 基本的な情報だけで続行
  }
  
  return { setlists, songs };
}

/**
 * 日付形式を変換 (YYYY/MM/DD -> YYYY-MM-DD)
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.replace(/(\d{4})\/(\d{1,2})\/(\d{1,2})/, (_, year, month, day) => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  });
}
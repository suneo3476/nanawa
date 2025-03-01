// src/utils/data-converter.ts

import type { Live } from '@/types/live';
import type { Song } from '@/types/song';
import type { SetlistItem } from '@/types/setlist';
import { enrichSongData, analyzeSongReleaseHistory } from './song-enricher';

/**
 * CSVデータをライブ情報に変換する
 */
export function parseLiveHistory(liveHistoryText: string): Live[] {
  const lives: Live[] = [];
  const lines = liveHistoryText.split('\n').filter(line => line.trim());
  
  let liveId = 1;
  
  // ヘッダー行をスキップするフラグ
  let skipHeader = false;
  // 先頭行が「日付	イベント名＠会場名」であればスキップ
  if (lines.length > 0 && lines[0].includes('日付') && lines[0].includes('イベント名')) {
    skipHeader = true;
  }
  
  for (let i = 0; i < lines.length; i++) {
    // ヘッダー行をスキップ
    if (i === 0 && skipHeader) continue;
    
    const line = lines[i];
    // "日付	イベント名＠会場名" の形式を解析
    const parts = line.split('\t');
    if (parts.length >= 2) {
      const date = parts[0].trim();
      const eventVenue = parts[1].trim();
      
      // "イベント名@会場名" を分割
      const match = eventVenue.match(/(.*?)@(.*)/);
      if (match) {
        const [, name, venue] = match;
        
        lives.push({
          liveId: `live_${String(liveId).padStart(3, '0')}`,
          date: formatDate(date), // YYYY/MM/DD -> YYYY-MM-DD
          name: name.trim(),
          venue: venue.trim(),
          memo: parts[2] ? parts[2].trim() : undefined
        });
        
        liveId++;
      }
    }
  }
  
  return lives;
}

/**
 * セットリスト履歴からセットリスト情報と楽曲情報を抽出
 * 順序の違いと日付を考慮したマッチング
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
  // 先頭行がヘッダーかどうかチェック
  if (lines.length > 0 && 
      lines[0].includes('イベント名') && 
      lines[0].includes('曲名') && 
      lines[0].includes('演奏順')) {
    skipHeader = true;
  }
  
  // イベント名ごとにグループ化されたセットリスト行
  const eventGroups: Record<string, string[]> = {};
  
  // セットリストをイベント名でグループ化
  for (let i = skipHeader ? 1 : 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split('\t');
    if (parts.length >= 4) {
      const eventVenue = parts[0].trim();
      if (!eventGroups[eventVenue]) {
        eventGroups[eventVenue] = [];
      }
      eventGroups[eventVenue].push(line);
    }
  }
  
  // セットリストの現在の処理順序を取得
  const sortedEvents = Object.keys(eventGroups);
  
  // ライブの日付順でソート（古い→新しい）
  const dateOrderedLives = [...lives].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // 逆順のライブリスト（新しい→古い）
  const reversedOrderedLives = [...dateOrderedLives].reverse();
  
  // ライブとイベントの対応マップを作成（複数候補がある場合はリストで保持）
  const liveEventMap: Map<string, string[]> = new Map();
  
  // セットリストとライブの順序関係を確認
  const isReversed = detectOrderRelationship(sortedEvents, dateOrderedLives);
  
  // イベントのマッチング情報を保持
  const eventMatched: Set<string> = new Set();
  const liveMatched: Set<string> = new Set();
  
  // まず完全一致するイベント名がある場合はそれを優先マッチング
  for (const eventName of sortedEvents) {
    // 完全一致するライブを検索
    for (const live of dateOrderedLives) {
      const liveFullName = `${live.name}@${live.venue}`;
      if (liveFullName === eventName && !liveMatched.has(live.liveId)) {
        // このイベントとライブをマッチング
        if (!liveEventMap.has(eventName)) {
          liveEventMap.set(eventName, []);
        }
        // オプショナルチェーンを追加
        liveEventMap.get(eventName)?.push(live.liveId);
        eventMatched.add(eventName);
        liveMatched.add(live.liveId);
        break;  // 一つのイベントにつき一つのライブだけマッチング
      }
    }
  }
  
  // 次に、日付の異なる同名イベントを処理
  // イベント名と会場のみで一致するライブを探す
  for (const eventName of sortedEvents) {
    if (eventMatched.has(eventName)) continue;  // 既にマッチした場合はスキップ
    
    // イベント名と会場を分離
    const eventParts = eventName.match(/(.*?)@(.*)/);
    if (!eventParts) continue;
    
    const [, eventTitle, venue] = eventParts;
    
    // 同じイベント名・会場のライブを検索（日付順）
    const candidateLives = isReversed ? reversedOrderedLives : dateOrderedLives;
    
    for (const live of candidateLives) {
      if (liveMatched.has(live.liveId)) continue;  // 既にマッチしたライブはスキップ
      
      if (live.name === eventTitle.trim() && live.venue === venue.trim()) {
        // 同じイベント名と会場のライブを発見
        if (!liveEventMap.has(eventName)) {
          liveEventMap.set(eventName, []);
        }
        // オプショナルチェーンを追加
        liveEventMap.get(eventName)?.push(live.liveId);
        eventMatched.add(eventName);
        liveMatched.add(live.liveId);
        break;  // 一つのイベントにつき一つのライブだけマッチング
      }
    }
  }
  
  // 最後に、まだマッチしていないイベントを順序ベースでマッチング
  // ここで日付の異なる同名ライブを区別する
  const unmatchedEvents = sortedEvents.filter(e => !eventMatched.has(e));
  const unmatchedLives = isReversed 
    ? reversedOrderedLives.filter(l => !liveMatched.has(l.liveId))
    : dateOrderedLives.filter(l => !liveMatched.has(l.liveId));
  
  // 未マッチのイベントと未マッチのライブを順序ベースで対応付け
  for (let i = 0; i < unmatchedEvents.length && i < unmatchedLives.length; i++) {
    const eventName = unmatchedEvents[i];
    const live = unmatchedLives[i];
    
    if (!liveEventMap.has(eventName)) {
      liveEventMap.set(eventName, []);
    }
    // オプショナルチェーンを追加
    liveEventMap.get(eventName)?.push(live.liveId);
    eventMatched.add(eventName);
    liveMatched.add(live.liveId);
  }
  
  // セットリストを処理
  for (const line of lines) {
    // "イベント名＠会場名	曲名	演奏順	形態" の形式を解析
    const parts = line.split('\t');
    if (parts.length >= 4) {
      const eventVenue = parts[0].trim();
      const songTitle = parts[1].trim();
      const orderStr = parts[2].trim();
      const type = parts[3].trim();
      
      // 対応するライブIDを取得
      const liveIds = liveEventMap.get(eventVenue);
      
      if (!liveIds || liveIds.length === 0) {
        console.warn(`対応するライブが見つかりません: "${eventVenue}"`);
        continue;
      }
      
      // このイベントの最初のライブIDを使用
      const liveId = liveIds[0];
      
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
  
  // デバッグ情報：マッチングの状況を確認
  console.log(`マッチしたイベント: ${eventMatched.size}/${sortedEvents.length}`);
  console.log(`マッチしたライブ: ${liveMatched.size}/${lives.length}`);
  
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
 * セットリストとライブリストの順序関係を推測する
 * trueを返すとセットリストが新しい順→古い順、falseだと古い順→新しい順と判断
 */
function detectOrderRelationship(
  sortedEvents: string[],
  dateOrderedLives: Live[]
): boolean {
  // 完全一致するイベント名のあるライブを探す
  const matchedPairs: Array<{eventIndex: number, live: Live}> = [];
  
  for (let i = 0; i < sortedEvents.length; i++) {
    const eventName = sortedEvents[i];
    
    for (const live of dateOrderedLives) {
      const liveFullName = `${live.name}@${live.venue}`;
      if (liveFullName === eventName) {
        matchedPairs.push({ eventIndex: i, live });
        break;
      }
    }
    
    // 少なくとも2つの一致があれば判定可能
    if (matchedPairs.length >= 2) break;
  }
  
  // 2つ以上一致するペアがあれば順序関係を推測
  if (matchedPairs.length >= 2) {
    // 日付の新しい順に並べる
    matchedPairs.sort((a, b) => 
      new Date(b.live.date).getTime() - new Date(a.live.date).getTime()
    );
    
    // インデックスも新しい日付（配列の先頭）が小さければ、セットリストは新→古順
    return matchedPairs[0].eventIndex < matchedPairs[1].eventIndex;
  }
  
  // 判断できない場合はデフォルトで逆順と仮定（新しい順→古い順）
  return true;
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
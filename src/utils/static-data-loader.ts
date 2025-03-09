// src/utils/static-data-loader.ts

import fs from 'fs';
import path from 'path';
import { parseLiveHistory, parseSetlistHistory } from './data-converter';
import type { Live } from '@/types/live';
import type { Song } from '@/types/song';
import type { SetlistItem } from '@/types/setlist';

// データキャッシュ（ビルド中に一度だけロード）
let cachedLives: Live[] | null = null;
let cachedSongs: Song[] | null = null;
let cachedSetlists: SetlistItem[] | null = null;

/**
 * ライブ履歴データを静的にロードする
 */
export function loadLivesData(): Live[] {
  if (cachedLives) return cachedLives;
  
  const dataDir = path.join(process.cwd(), 'data');
  const liveHistoryPath = path.join(dataDir, 'live_history.txt');
  
  try {
    const liveHistoryText = fs.readFileSync(liveHistoryPath, 'utf8');
    cachedLives = parseLiveHistory(liveHistoryText);
    return cachedLives;
  } catch (error) {
    console.error('Failed to load lives data:', error);
    return [];
  }
}

/**
 * 楽曲とセットリストデータを静的にロードする
 */
export async function loadSongsAndSetlists(): Promise<{
  songs: Song[];
  setlists: SetlistItem[];
}> {
  if (cachedSongs && cachedSetlists) {
    return { songs: cachedSongs, setlists: cachedSetlists };
  }
  
  const dataDir = path.join(process.cwd(), 'data');
  const setlistHistoryPath = path.join(dataDir, 'setlist_history.txt');
  
  try {
    const setlistHistoryText = fs.readFileSync(setlistHistoryPath, 'utf8');
    const lives = loadLivesData();
    
    // parseSetlistHistoryはasyncなのでawaitが必要
    const result = await parseSetlistHistory(setlistHistoryText, lives);
    
    // キャッシュを更新
    cachedSongs = result.songs;
    cachedSetlists = result.setlists;
    
    return result;
  } catch (error) {
    console.error('Failed to load songs and setlists data:', error);
    return { songs: [], setlists: [] };
  }
}

/**
 * 特定のライブデータを取得する
 */
export function getLiveById(liveId: string): Live | null {
  const lives = loadLivesData();
  return lives.find(live => live.liveId === liveId) || null;
}

/**
 * 特定の楽曲データを取得する
 */
export async function getSongById(songId: string): Promise<Song | null> {
  const { songs } = await loadSongsAndSetlists();
  return songs.find(song => song.songId === songId) || null;
}

/**
 * ライブのセットリスト情報を取得する 
 */
export async function getSetlistForLive(liveId: string): Promise<{
  song: Song;
  order: number;
  memo: string;
}[]> {
  const { songs, setlists } = await loadSongsAndSetlists();
  
  // このライブのセットリストアイテムをフィルタリング
  const liveSetlist = setlists.filter(item => item.liveId === liveId);
  
  // 演奏順でソート
  liveSetlist.sort((a, b) => a.order - b.order);
  
  // 曲情報とセットリスト情報を組み合わせる
  return liveSetlist.map(item => {
    const song = songs.find(s => s.songId === item.songId);
    if (!song) {
      throw new Error(`Song with ID ${item.songId} not found`);
    }
    
    return {
      song,
      order: item.order,
      memo: item.memo || ''
    };
  });
}

/**
 * 静的生成用にすべてのライブIDを取得する
 */
export function getAllLiveIds(): { liveId: string }[] {
  const lives = loadLivesData();
  return lives.map(live => ({ liveId: live.liveId }));
}

/**
 * 静的生成用にすべての楽曲IDを取得する
 */
export async function getAllSongIds(): Promise<{ songId: string }[]> {
  const { songs } = await loadSongsAndSetlists();
  return songs.map(song => ({ songId: song.songId }));
}

/**
 * ライブデータをセットリスト情報と一緒に取得する
 */
export async function getLiveWithSetlist(liveId: string): Promise<Live & { setlist: any[] }> {
  const live = getLiveById(liveId);
  if (!live) {
    throw new Error(`Live with ID ${liveId} not found`);
  }
  
  const setlist = await getSetlistForLive(liveId);
  
  return {
    ...live,
    setlist: setlist.map(item => ({
      songId: item.song.songId,
      title: item.song.title,
      order: item.order,
      memo: item.memo
    }))
  };
}

/**
 * 楽曲データをパフォーマンス情報と一緒に取得する
 */
export async function getSongWithPerformances(songId: string): Promise<Song & { performances: any }> {
  const song = await getSongById(songId);
  if (!song) {
    throw new Error(`Song with ID ${songId} not found`);
  }
  
  const { setlists } = await loadSongsAndSetlists();
  const lives = loadLivesData();
  
  // この曲のパフォーマンス（演奏履歴）を取得
  const songSetlists = setlists.filter(item => item.songId === songId);
  
  // 演奏回数
  const count = songSetlists.length;
  
  // 演奏したライブの日付でソート
  const livePerformances = songSetlists.map(item => {
    const live = lives.find(l => l.liveId === item.liveId);
    return {
      liveId: item.liveId,
      date: live ? live.date : '',
      liveName: live ? live.name : ''
    };
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // 初演奏と最終演奏の情報
  const firstPerformance = livePerformances[0] || null;
  const lastPerformance = livePerformances[livePerformances.length - 1] || null;
  
  return {
    ...song,
    performances: {
      count,
      firstPerformance,
      lastPerformance,
      history: livePerformances
    }
  };
}

/**
 * データの事前キャッシュを行う（ビルド開始時に呼び出すことでビルド時間を短縮）
 */
export async function preloadAllData(): Promise<void> {
  // すべてのデータを事前ロードしてキャッシュ
  loadLivesData();
  await loadSongsAndSetlists();
  console.log('All data preloaded for static generation');
}
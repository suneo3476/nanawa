// src/utils/static-data-loader.ts

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { Live } from '@/types/live';
import type { Song } from '@/types/song';
import type { SetlistItem } from '@/types/setlist';
import type { Album } from '@/types/album';
import type { AlbumTrack } from '@/types/albumTrack';

// データキャッシュ（ビルド中に一度だけロード）
let cachedLives: Live[] | null = null;
let cachedSongs: Song[] | null = null;
let cachedSetlists: SetlistItem[] | null = null;
let cachedAlbums: Album[] | null = null;
let cachedAlbumTracks: AlbumTrack[] | null = null;

/**
 * YAMLファイルを読み込んでパースする汎用関数
 */
function loadYamlFile<T>(filePath: string): T[] {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return yaml.load(fileContent) as T[];
  } catch (error) {
    console.error(`Failed to load YAML file ${filePath}:`, error);
    return [];
  }
}

/**
 * ライブデータをYAMLから読み込む
 */
export function loadLivesData(): Live[] {
  if (cachedLives) return cachedLives;
  
  const dataDir = path.join(process.cwd(), 'data_yaml');
  const livesPath = path.join(dataDir, 'lives.yml');
  
  try {
    cachedLives = loadYamlFile<Live>(livesPath);
    return cachedLives;
  } catch (error) {
    console.error('Failed to load lives data:', error);
    return [];
  }
}

/**
 * 楽曲データをYAMLから読み込む
 */
export function loadSongsData(): Song[] {
  if (cachedSongs) return cachedSongs;
  
  const dataDir = path.join(process.cwd(), 'data_yaml');
  const songsPath = path.join(dataDir, 'songs.yml');
  
  try {
    cachedSongs = loadYamlFile<Song>(songsPath);
    return cachedSongs;
  } catch (error) {
    console.error('Failed to load songs data:', error);
    return [];
  }
}

/**
 * セットリストデータをYAMLから読み込む
 */
export function loadSetlistsData(): SetlistItem[] {
  if (cachedSetlists) return cachedSetlists;
  
  const dataDir = path.join(process.cwd(), 'data_yaml');
  const setlistsPath = path.join(dataDir, 'setlists.yml');
  
  try {
    cachedSetlists = loadYamlFile<SetlistItem>(setlistsPath);
    return cachedSetlists;
  } catch (error) {
    console.error('Failed to load setlists data:', error);
    return [];
  }
}

/**
 * アルバムデータをYAMLから読み込む
 */
export function loadAlbumsData(): Album[] {
  if (cachedAlbums) return cachedAlbums;
  
  const dataDir = path.join(process.cwd(), 'data_yaml');
  const albumsPath = path.join(dataDir, 'albums.yml');
  
  try {
    cachedAlbums = loadYamlFile<Album>(albumsPath);
    return cachedAlbums;
  } catch (error) {
    console.error('Failed to load albums data:', error);
    return [];
  }
}

/**
 * アルバム収録曲データをYAMLから読み込む
 */
export function loadAlbumTracksData(): AlbumTrack[] {
  if (cachedAlbumTracks) return cachedAlbumTracks;
  
  const dataDir = path.join(process.cwd(), 'data_yaml');
  const albumTracksPath = path.join(dataDir, 'album_tracks.yml');
  
  try {
    cachedAlbumTracks = loadYamlFile<AlbumTrack>(albumTracksPath);
    return cachedAlbumTracks;
  } catch (error) {
    console.error('Failed to load album tracks data:', error);
    return [];
  }
}

/**
 * 楽曲とセットリストデータを読み込む
 */
export async function loadSongsAndSetlists(): Promise<{
  songs: Song[];
  setlists: SetlistItem[];
}> {
  if (cachedSongs && cachedSetlists) {
    return { songs: cachedSongs, setlists: cachedSetlists };
  }
  
  const songs = loadSongsData();
  const setlists = loadSetlistsData();
  
  // キャッシュを更新
  cachedSongs = songs;
  cachedSetlists = setlists;
  
  return { songs, setlists };
}

/**
 * 特定のライブデータを取得する
 */
export function getLiveById(liveId: string): Live | null {
  const lives = loadLivesData();
  return lives.find(live => live.id === liveId) || null;
}

/**
 * 特定の楽曲データを取得する
 */
export function getSongById(songId: string): Song | null {
  const songs = loadSongsData();
  return songs.find(song => song.id === songId) || null;
}

/**
 * ライブのセットリスト情報を取得する 
 */
export function getSetlistForLive(liveId: string): {
  song: Song;
  order: number;
  memo: string;
}[] {
  const songs = loadSongsData();
  const setlists = loadSetlistsData();
  
  // このライブのセットリストアイテムをフィルタリング
  const liveSetlist = setlists.filter(item => item.liveId === liveId);
  
  // 演奏順でソート
  liveSetlist.sort((a, b) => a.order - b.order);
  
  // 曲情報とセットリスト情報を組み合わせる
  return liveSetlist.map(item => {
    const song = songs.find(s => s.id === item.songId);
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
  return lives.map(live => ({ liveId: live.id }));
}

/**
 * 静的生成用にすべての楽曲IDを取得する
 */
export function getAllSongIds(): { songId: string }[] {
  const songs = loadSongsData();
  return songs.map(song => ({ songId: song.id }));
}

/**
 * ライブデータをセットリスト情報と一緒に取得する
 */
export function getLiveWithSetlist(liveId: string): Live & { setlist: any[] } {
  const live = getLiveById(liveId);
  if (!live) {
    throw new Error(`Live with ID ${liveId} not found`);
  }
  
  const setlist = getSetlistForLive(liveId);
  
  return {
    ...live,
    setlist: setlist.map(item => ({
      songId: item.song.id,
      title: item.song.title,
      order: item.order,
      memo: item.memo
    }))
  };
}

/**
 * 楽曲データをパフォーマンス情報と一緒に取得する
 */
export function getSongWithPerformances(songId: string): Song & { performances: any } {
  const song = getSongById(songId);
  if (!song) {
    throw new Error(`Song with ID ${songId} not found`);
  }
  
  const setlists = loadSetlistsData();
  const lives = loadLivesData();
  
  // この曲のパフォーマンス（演奏履歴）を取得
  const songSetlists = setlists.filter(item => item.songId === songId);
  
  // 演奏回数
  const count = songSetlists.length;
  
  // 演奏したライブの日付でソート
  const livePerformances = songSetlists.map(item => {
    const live = lives.find(l => l.id === item.liveId);
    return {
      liveId: item.liveId,
      date: live ? live.date : '',
      liveName: live ? live.eventName : ''
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
 * 曲の収録アルバム情報を取得する
 */
export function getSongAlbums(songId: string): Album[] {
  const albumTracks = loadAlbumTracksData();
  const albums = loadAlbumsData();
  
  // この曲が収録されているアルバムIDを取得
  const albumIds = albumTracks
    .filter(track => track.songId === songId)
    .map(track => track.albumId);
  
  // アルバム情報を取得
  return albums.filter(album => albumIds.includes(album.id));
}

/**
 * データの事前キャッシュを行う（ビルド開始時に呼び出すことでビルド時間を短縮）
 */
export function preloadAllData(): void {
  // すべてのデータを事前ロード
  loadLivesData();
  loadSongsData();
  loadSetlistsData();
  loadAlbumsData();
  loadAlbumTracksData();
  console.log('All data preloaded for static generation');
}
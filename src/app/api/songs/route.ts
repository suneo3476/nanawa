// src/app/api/songs/route.ts

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { parseLiveHistory, parseSetlistHistory } from '@/utils/data-converter';

export async function GET() {
  try {
    // ライブ履歴とセットリスト履歴を読み込む
    const liveHistoryPath = path.join(process.cwd(), 'data', 'live_history.txt');
    const setlistHistoryPath = path.join(process.cwd(), 'data', 'setlist_history.txt');
    
    const [liveHistoryText, setlistHistoryText] = await Promise.all([
      fs.readFile(liveHistoryPath, 'utf8'),
      fs.readFile(setlistHistoryPath, 'utf8')
    ]);
    
    // データの変換
    const lives = parseLiveHistory(liveHistoryText);
    
    // 非同期処理を await で正しく処理
    const { songs } = await parseSetlistHistory(setlistHistoryText, lives);
    
    // JSON シリアライズ可能なデータだけにフィルタリング
    const serializableSongs = songs.map(song => ({
      songId: song.songId,
      title: song.title,
      album: song.album || '',
      releaseDate: song.releaseDate || '',
      trackNumber: song.trackNumber,
      isSingle: song.isSingle,
      albumCategory: song.albumCategory,
      // appearsOn を含める
      appearsOn: song.appearsOn || [],
      // その他の情報...
      firstReleaseAlbum: song.firstRelease?.album || '',
      firstReleaseDate: song.firstRelease?.releaseDate || '',
      originalAlbum: song.originalAlbum || ''
    }));
    
    return NextResponse.json(serializableSongs);
  } catch (error) {
    console.error('Failed to load songs data:', error);
    return NextResponse.json(
      { error: 'Failed to load songs data' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { parseLiveHistory, parseSetlistHistory, enrichSongData } from '@/utils/data-converter';

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
    const { songs: songsMap } = parseSetlistHistory(setlistHistoryText, lives);
    
    // 楽曲情報を配列に変換
    let songs = Array.from(songsMap.values());
    
    // 楽曲情報を補完
    songs = enrichSongData(songs);
    
    // 楽曲をソート
    songs.sort((a, b) => a.title.localeCompare(b.title));
    
    return NextResponse.json(songs);
  } catch (error) {
    console.error('Failed to load songs data:', error);
    return NextResponse.json(
      { error: 'Failed to load songs data' },
      { status: 500 }
    );
  }
}

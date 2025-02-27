import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { parseLiveHistory, parseSetlistHistory, enrichSongData } from '@/utils/data-converter';

export async function GET(
  request: Request,
  { params }: { params: { songId: string } }
) {
  try {
    const songId = params.songId;
    
    // ライブ履歴とセットリスト履歴を読み込む
    const liveHistoryPath = path.join(process.cwd(), 'data', 'live_history.txt');
    const setlistHistoryPath = path.join(process.cwd(), 'data', 'setlist_history.txt');
    
    const [liveHistoryText, setlistHistoryText] = await Promise.all([
      fs.readFile(liveHistoryPath, 'utf8'),
      fs.readFile(setlistHistoryPath, 'utf8')
    ]);
    
    // データの変換
    const lives = parseLiveHistory(liveHistoryText);
    const { songs } = parseSetlistHistory(setlistHistoryText, lives);
    
    // 曲情報の補完
    const enrichedSongs = enrichSongData(Array.from(songs.values()));
    
    // 指定されたIDの曲を検索
    const song = enrichedSongs.find(song => song.songId === songId);
    
    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(song);
  } catch (error) {
    console.error('Failed to load song data:', error);
    return NextResponse.json(
      { error: 'Failed to load song data' },
      { status: 500 }
    );
  }
}
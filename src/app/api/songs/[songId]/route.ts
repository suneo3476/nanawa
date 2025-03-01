// src/app/api/songs/[songId]/route.ts

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { parseLiveHistory, parseSetlistHistory } from '@/utils/data-converter';
import { formatSongAppearances } from '@/utils/song-enricher';

export async function GET(
  request: Request,
  { params }: { params: { songId: string } }
) {
  const songId = params.songId;
  
  try {
    // データ読み込み
    const liveHistoryPath = path.join(process.cwd(), 'data', 'live_history.txt');
    const setlistHistoryPath = path.join(process.cwd(), 'data', 'setlist_history.txt');
    const discographyPath = path.join(process.cwd(), 'data', 'discography.txt');
    
    const [liveHistoryText, setlistHistoryText, discographyText] = await Promise.all([
      fs.readFile(liveHistoryPath, 'utf8'),
      fs.readFile(setlistHistoryPath, 'utf8'),
      fs.readFile(discographyPath, 'utf8')
    ]);
    
    // データ変換
    const lives = parseLiveHistory(liveHistoryText);
    const { songs } = await parseSetlistHistory(setlistHistoryText, lives);
    
    // 楽曲を探す
    const song = songs.find(s => s.songId === songId);
    
    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }
    
    // ディスコグラフィデータを解析
    const albums = parseDiscography(discographyText);
    
    // 収録作品リストをフォーマット
    const formattedAppearances = formatSongAppearances(song, albums);
    
    // この曲が演奏されたライブを取得
    const { setlists } = await parseSetlistHistory(setlistHistoryText, lives);
    const songSetlists = setlists.filter(item => item.songId === songId);
    
    // ライブ情報を追加
    const performances = songSetlists.map(item => {
      const live = lives.find(l => l.liveId === item.liveId);
      return {
        liveId: item.liveId,
        date: live?.date || '',
        name: live?.name || '',
        venue: live?.venue || '',
        order: item.order
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // JSON形式で返却
    return NextResponse.json({
      ...song,
      formattedAppearances,
      performances
    });
  } catch (error) {
    console.error(`Failed to load song data for ID ${songId}:`, error);
    return NextResponse.json(
      { error: 'Failed to load song data' },
      { status: 500 }
    );
  }
}

/**
 * ディスコグラフィデータを解析
 */
function parseDiscography(data: string): Array<{
  category: string;
  subCategory: string;
  title: string;
  releaseDate: string;
}> {
  const result = [];
  const lines = data.split('\n').filter(line => line.trim());
  
  // ヘッダー行をスキップ
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split('\t');
    if (parts.length >= 4) {
      result.push({
        category: parts[0].trim(),
        subCategory: parts[1].trim(),
        title: parts[2].trim(),
        releaseDate: parts[3].trim()
      });
    }
  }
  
  return result;
}
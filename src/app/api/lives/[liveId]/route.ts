// src/app/api/lives/[liveId]/route.ts

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { parseLiveHistory, parseSetlistHistory } from '@/utils/data-converter';

export async function GET(
  request: Request,
  { params }: { params: { liveId: string } }
) {
  try {
    const liveId = params.liveId;
    
    // ライブ履歴とセットリスト履歴を読み込む
    const liveHistoryPath = path.join(process.cwd(), 'data', 'live_history.txt');
    const setlistHistoryPath = path.join(process.cwd(), 'data', 'setlist_history.txt');
    
    const [liveHistoryText, setlistHistoryText] = await Promise.all([
      fs.readFile(liveHistoryPath, 'utf8'),
      fs.readFile(setlistHistoryPath, 'utf8')
    ]);
    
    // データの変換
    const lives = parseLiveHistory(liveHistoryText);
    const { setlists, songs } = await parseSetlistHistory(setlistHistoryText, lives);
    
    // 指定されたIDのライブを検索
    const live = lives.find(live => live.liveId === liveId);
    
    if (!live) {
      return NextResponse.json(
        { error: 'Live not found' },
        { status: 404 }
      );
    }
    
    // このライブのセットリストを取得
    const liveSetlist = setlists
      .filter(item => item.liveId === liveId)
      .sort((a, b) => a.order - b.order)
      .map(item => {
        const song = songs.find(s => s.songId === item.songId);
        return {
          order: item.order,
          songId: item.songId,
          title: song ? song.title : '不明な曲',
          album: song?.album,
          memo: item.memo
        };
      });
    
    // 結果を返す
    return NextResponse.json({
      ...live,
      setlist: liveSetlist
    });
  } catch (error) {
    console.error('Failed to load live data:', error);
    return NextResponse.json(
      { error: 'Failed to load live data' },
      { status: 500 }
    );
  }
}
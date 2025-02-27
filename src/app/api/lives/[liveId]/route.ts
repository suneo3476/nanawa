import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { parseLiveHistory } from '@/utils/data-converter';

export async function GET(
  request: Request,
  { params }: { params: { liveId: string } }
) {
  try {
    const liveId = params.liveId;
    
    // ライブ履歴を読み込む
    const liveHistoryPath = path.join(process.cwd(), 'data', 'live_history.txt');
    const liveHistoryText = await fs.readFile(liveHistoryPath, 'utf8');
    
    // データの変換
    const lives = parseLiveHistory(liveHistoryText);
    
    // 指定されたIDのライブを検索
    const live = lives.find(live => live.liveId === liveId);
    
    if (!live) {
      return NextResponse.json(
        { error: 'Live not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(live);
  } catch (error) {
    console.error('Failed to load live data:', error);
    return NextResponse.json(
      { error: 'Failed to load live data' },
      { status: 500 }
    );
  }
}
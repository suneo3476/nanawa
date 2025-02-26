import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { parseLiveHistory } from '@/utils/data-converter';

export async function GET() {
  try {
    // ライブ履歴を読み込む
    const liveHistoryPath = path.join(process.cwd(), 'data', 'live_history.txt');
    const liveHistoryText = await fs.readFile(liveHistoryPath, 'utf8');
    
    // データの変換
    const lives = parseLiveHistory(liveHistoryText);
    
    // 日付でソート (最新順)
    lives.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return NextResponse.json(lives);
  } catch (error) {
    console.error('Failed to load lives data:', error);
    return NextResponse.json(
      { error: 'Failed to load lives data' },
      { status: 500 }
    );
  }
}

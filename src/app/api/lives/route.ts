// src/app/api/lives/route.ts

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
    
    // JSON シリアライズ可能なオブジェクトに変換
    const serializableLives = lives.map(live => ({
      liveId: live.liveId,
      name: live.name,
      date: live.date,
      venue: live.venue,
      memo: live.memo || ''
    }));
    
    return NextResponse.json(serializableLives);
  } catch (error) {
    console.error('Failed to load lives data:', error);
    return NextResponse.json(
      { error: 'Failed to load lives data' },
      { status: 500 }
    );
  }
}
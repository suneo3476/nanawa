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
    const { setlists } = parseSetlistHistory(setlistHistoryText, lives);
    
    return NextResponse.json(setlists);
  } catch (error) {
    console.error('Failed to load setlists data:', error);
    return NextResponse.json(
      { error: 'Failed to load setlists data' },
      { status: 500 }
    );
  }
}

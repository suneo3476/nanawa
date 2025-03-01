// scripts/migrate-data.ts
/**
 * このスクリプトは古いフォーマットのデータファイルを新しいID対応フォーマットに変換します
 * 実行方法: npx ts-node scripts/migrate-data.ts
 */

import fs from 'fs';
import path from 'path';

// パス設定
const DATA_DIR = path.join(process.cwd(), 'data');
const OLD_LIVE_HISTORY_PATH = path.join(DATA_DIR, 'live_history_old.txt');
const OLD_SETLIST_HISTORY_PATH = path.join(DATA_DIR, 'setlist_history_old.txt');
const NEW_LIVE_HISTORY_PATH = path.join(DATA_DIR, 'live_history.txt');
const NEW_SETLIST_HISTORY_PATH = path.join(DATA_DIR, 'setlist_history.txt');

// ライブ履歴の変換
function migrateLiveHistory() {
  try {
    // 古いデータを読み込む
    const oldLiveData = fs.readFileSync(OLD_LIVE_HISTORY_PATH, 'utf8');
    const lines = oldLiveData.split('\n').filter(line => line.trim());
    
    // ヘッダー行をスキップするか判断
    let startIndex = 0;
    if (lines[0].includes('日付') && lines[0].includes('イベント名')) {
      startIndex = 1;
    }
    
    // 新しいデータを生成
    const newLines = ['出演イベントID\t日付\tイベント名＠会場名'];
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split('\t');
      
      if (parts.length >= 2) {
        const eventId = lines.length - i; // 逆順でIDを付与（新しいものから古いものへ）
        const date = parts[0].trim();
        const eventVenue = parts[1].trim();
        
        newLines.push(`${eventId}\t${date}\t${eventVenue}`);
      }
    }
    
    // 新しいファイルに書き込む
    fs.writeFileSync(NEW_LIVE_HISTORY_PATH, newLines.join('\n'));
    console.log(`ライブ履歴の変換が完了しました。${newLines.length - 1}件のライブデータを生成しました。`);
    
    return newLines.length - 1; // ヘッダー行を除いた件数を返す
  } catch (error) {
    console.error('ライブ履歴の変換中にエラーが発生しました:', error);
    return 0;
  }
}

// セットリスト履歴の変換
function migrateSetlistHistory(liveCount: number) {
  try {
    // 古いデータを読み込む
    const oldSetlistData = fs.readFileSync(OLD_SETLIST_HISTORY_PATH, 'utf8');
    const lines = oldSetlistData.split('\n').filter(line => line.trim());
    
    // ヘッダー行をスキップするか判断
    let startIndex = 0;
    if (lines[0].includes('イベント名') && lines[0].includes('曲名')) {
      startIndex = 1;
    }
    
    // 新しいデータを生成
    const newLines = ['出演イベントID\tイベント名＠会場名\t曲名\t演奏順\t形態'];
    
    // イベント名からIDへのマッピングを作成
    const eventMap = new Map<string, number>();
    
    // 新しいライブ履歴を読み込み、マッピングを構築
    const newLiveData = fs.readFileSync(NEW_LIVE_HISTORY_PATH, 'utf8');
    const liveLines = newLiveData.split('\n').filter(line => line.trim());
    
    for (let i = 1; i < liveLines.length; i++) { // ヘッダーをスキップ
      const parts = liveLines[i].split('\t');
      if (parts.length >= 3) {
        const id = parts[0].trim();
        const eventVenue = parts[2].trim();
        eventMap.set(eventVenue, parseInt(id));
      }
    }
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split('\t');
      
      if (parts.length >= 4) {
        const eventVenue = parts[0].trim();
        const songTitle = parts[1].trim();
        const orderStr = parts[2].trim();
        const type = parts[3].trim();
        
        // イベント名からIDを取得
        const eventId = eventMap.get(eventVenue);
        
        if (eventId) {
          newLines.push(`${eventId}\t${eventVenue}\t${songTitle}\t${orderStr}\t${type}`);
        } else {
          console.warn(`警告: "${eventVenue}" に対応するイベントIDが見つかりませんでした。`);
        }
      }
    }
    
    // 新しいファイルに書き込む
    fs.writeFileSync(NEW_SETLIST_HISTORY_PATH, newLines.join('\n'));
    console.log(`セットリスト履歴の変換が完了しました。${newLines.length - 1}件のセットリストデータを生成しました。`);
  } catch (error) {
    console.error('セットリスト履歴の変換中にエラーが発生しました:', error);
  }
}

// メイン処理
function main() {
  console.log('データ移行を開始します...');
  
  // ライブ履歴の変換
  const liveCount = migrateLiveHistory();
  
  // セットリスト履歴の変換
  if (liveCount > 0) {
    migrateSetlistHistory(liveCount);
  }
  
  console.log('データ移行が完了しました。');
}

// スクリプト実行
main();
import type { Live } from '@/types/live';
import type { Song } from '@/types/song';
import type { SetlistItem } from '@/types/setlist';

/**
 * CSVデータをライブ情報に変換する
 */
export function parseLiveHistory(liveHistoryText: string): Live[] {
  const lives: Live[] = [];
  const lines = liveHistoryText.split('\n').filter(line => line.trim());
  
  let liveId = 1;
  
  for (const line of lines) {
    // "日付	イベント名＠会場名" の形式を解析
    const parts = line.split('\t');
    if (parts.length >= 2) {
      const date = parts[0].trim();
      const eventVenue = parts[1].trim();
      
      // "イベント名@会場名" を分割
      const match = eventVenue.match(/(.*?)@(.*)/);
      if (match) {
        const [, name, venue] = match;
        
        lives.push({
          liveId: `live_${String(liveId).padStart(3, '0')}`,
          date: formatDate(date), // YYYY/MM/DD -> YYYY-MM-DD
          name: name.trim(),
          venue: venue.trim(),
          memo: parts[2] ? parts[2].trim() : undefined
        });
        
        liveId++;
      }
    }
  }
  
  return lives;
}

/**
 * セットリスト履歴からセットリスト情報と楽曲情報を抽出
 */
export function parseSetlistHistory(
  setlistText: string,
  lives: Live[]
): { setlists: SetlistItem[], songs: Map<string, Song> } {
  const setlists: SetlistItem[] = [];
  const songsMap = new Map<string, Song>();
  
  const lines = setlistText.split('\n').filter(line => line.trim());
  let songId = 1;
  
  for (const line of lines) {
    // "イベント名＠会場名	曲名	演奏順	形態" の形式を解析
    const parts = line.split('\t');
    if (parts.length >= 4) {
      const eventVenue = parts[0].trim();
      const songTitle = parts[1].trim();
      const orderStr = parts[2].trim();
      const type = parts[3].trim();
      
      // ライブIDを検索
      const live = lives.find(l => {
        const fullName = `${l.name}@${l.venue}`;
        return fullName === eventVenue;
      });
      
      if (!live) continue;
      
      // 楽曲を検索または作成
      let currentSongId: string | undefined;
      
      // 既存の同じタイトルの曲を探す
      for (const [id, song] of songsMap.entries()) {
        if (song.title === songTitle) {
          currentSongId = id;
          break;
        }
      }
      
      // 新しい曲を作成
      if (!currentSongId) {
        currentSongId = `song_${String(songId).padStart(3, '0')}`;
        const currentSong: Song = {
          songId: currentSongId,
          title: songTitle,
          album: '', // 後で補完
          releaseDate: ''
        };
        songsMap.set(currentSongId, currentSong);
        songId++;
      }
      
      // セットリストアイテムを作成
      setlists.push({
        liveId: live.liveId,
        songId: currentSongId,
        order: parseInt(orderStr),
        memo: type === 'メドレー' ? 'メドレー形式で演奏' : ''
      });
    }
  }
  
  return { setlists, songs: songsMap };
}

/**
 * 日付形式を変換 (YYYY/MM/DD -> YYYY-MM-DD)
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.replace(/(\d{4})\/(\d{1,2})\/(\d{1,2})/, (_, year, month, day) => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  });
}

/**
 * 曲情報の補完
 */
export function enrichSongData(songs: Song[]): Song[] {
  // aikoの代表曲の情報
  const aikoSongInfo: Record<string, { album: string, releaseDate: string }> = {
    'カブトムシ': { album: '暁のラブレター', releaseDate: '2004-08-04' },
    '花火': { album: '秘密', releaseDate: '2008-11-12' },
    'ボーイフレンド': { album: '秘密', releaseDate: '2008-11-12' },
    'キラキラ': { album: '暁のラブレター', releaseDate: '2004-08-04' },
    'ロージー': { album: 'ロージー', releaseDate: '2005-11-30' },
    '愛の病': { album: '彼女', releaseDate: '2006-06-21' },
    'マント': { album: 'まとめ I', releaseDate: '2003-11-12' },
    '蝶々結び': { album: '蝶々結び', releaseDate: '2010-03-31' },
    // 他の曲情報
  };
  
  return songs.map(song => {
    const info = aikoSongInfo[song.title];
    if (info) {
      return {
        ...song,
        album: info.album,
        releaseDate: info.releaseDate
      };
    }
    // 情報がない場合はそのまま返す
    return song;
  });
}

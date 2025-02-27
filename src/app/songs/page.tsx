import { Header } from '@/components/Header/Header';
import { SongsClient } from './SongsClient';
import type { Song } from '@/types/song';

// サーバーコンポーネントでデータ取得
async function getSongsWithStats() {
  try {
    const [songsRes, setlistsRes, livesRes] = await Promise.all([
      fetch('http://localhost:3000/api/songs', { next: { revalidate: 3600 } }),
      fetch('http://localhost:3000/api/setlists', { next: { revalidate: 3600 } }),
      fetch('http://localhost:3000/api/lives', { next: { revalidate: 3600 } })
    ]);
    
    if (!songsRes.ok || !setlistsRes.ok || !livesRes.ok) {
      throw new Error('データの取得に失敗しました');
    }
    
    const songs = await songsRes.json();
    const setlists = await setlistsRes.json();
    const lives = await livesRes.json();
    
    // 各曲の統計情報を計算
    return songs.map((song: Song) => {
      // この曲が含まれるセットリスト
      const songSetlists = setlists.filter((item) => item.songId === song.songId);
      
      // 演奏回数
      const playCount = songSetlists.length;
      
      if (playCount === 0) {
        return { song, stats: { playCount: 0 } };
      }
      
      // 演奏したライブの情報を取得
      const performances = songSetlists.map((item) => {
        const live = lives.find((l) => l.liveId === item.liveId);
        return {
          liveId: item.liveId,
          date: live ? live.date : '',
          liveName: live ? live.name : '不明なライブ'
        };
      });
      
      // 日付でソート
      performances.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // 初演奏と最終演奏
      const firstPlay = performances[0];
      const lastPlay = performances[performances.length - 1];
      
      return {
        song,
        stats: {
          playCount,
          firstPlay: firstPlay ? {
            liveName: firstPlay.liveName,
            date: firstPlay.date
          } : undefined,
          lastPlay: lastPlay && lastPlay !== firstPlay ? {
            liveName: lastPlay.liveName,
            date: lastPlay.date
          } : undefined
        }
      };
    });
  } catch (error) {
    console.error('楽曲データ取得エラー:', error);
    return [];
  }
}

export const metadata = {
  title: '楽曲一覧 | 七輪',
  description: 'aikoコピーバンド「七輪」の演奏楽曲一覧',
};

export default async function SongsPage() {
  const songsWithStats = await getSongsWithStats();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">楽曲一覧</h1>
        <SongsClient songs={songsWithStats} />
      </main>
    </div>
  );
}
import { Header } from '@/components/Header/Header';
import { LiveListClient } from '@/components/LiveList/LiveListClient';
import type { Live } from '@/types/live';

// サーバーコンポーネントでデータ取得
async function getLives() {
  try {
    // APIからデータを取得
    const res = await fetch('http://localhost:3000/api/lives', { 
      next: { revalidate: 3600 } // 1時間ごとに再検証
    });
    
    if (!res.ok) {
      throw new Error('ライブデータの取得に失敗しました');
    }
    
    const lives = await res.json();
    
    // 各ライブのセットリスト情報を取得
    const setlistsRes = await fetch('http://localhost:3000/api/setlists', {
      next: { revalidate: 3600 }
    });
    
    const songsRes = await fetch('http://localhost:3000/api/songs', {
      next: { revalidate: 3600 }
    });
    
    if (!setlistsRes.ok || !songsRes.ok) {
      return lives.map(live => ({ ...live, setlist: [] }));
    }
    
    const setlists = await setlistsRes.json();
    const songs = await songsRes.json();
    
    // 各ライブにセットリストを関連付け
    return lives.map((live: Live) => {
      const liveSetlist = setlists
        .filter((item) => item.liveId === live.liveId)
        .sort((a, b) => a.order - b.order);
      
      const setlist = liveSetlist.map((item) => {
        const song = songs.find((s) => s.songId === item.songId);
        return {
          songId: item.songId,
          title: song ? song.title : '不明な曲'
        };
      });
      
      return {
        ...live,
        setlist
      };
    });
  } catch (error) {
    console.error('ライブデータ取得エラー:', error);
    return [];
  }
}

export default async function Home() {
  const livesWithSetlists = await getLives();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">七輪ライブ一覧</h1>
        <LiveListClient lives={livesWithSetlists} />
      </main>
    </div>
  );
}
// src/app/lives/page.tsx

import { Suspense } from 'react';
import { fetchLives, fetchSongs, fetchSetlists } from '@/utils/api';
import { LiveViewIntegrated } from '@/components/LiveViewIntegrated';

export default async function LivesPage() {
  // サーバーコンポーネントでデータ取得
  const [lives, songs, setlists] = await Promise.all([
    fetchLives(),
    fetchSongs(),
    fetchSetlists()
  ]);
  
  // セットリスト情報をライブデータに追加
  const livesWithSetlist = lives.map(live => {
    const liveSetlist = setlists
      .filter(item => item.liveId === live.liveId)
      .sort((a, b) => a.order - b.order)
      .map(item => {
        const song = songs.find(s => s.songId === item.songId);
        return {
          songId: item.songId,
          title: song?.title || 'Unknown'
        };
      });
    
    return {
      ...live,
      setlist: liveSetlist
    };
  });
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">出演ライブ</h1>
      
      <Suspense fallback={<div className="p-8 text-center">ライブデータを読み込み中...</div>}>
        <LiveViewIntegrated lives={livesWithSetlist} />
      </Suspense>
    </div>
  );
}
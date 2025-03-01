// src/app/stats/page.tsx

import { StatsDashboard } from '@/components/StatsDashboard';
import { fetchLives, fetchSongs, fetchSetlists } from '@/utils/api';

export default async function StatsPage() {
  // サーバーコンポーネントでデータ取得
  const [lives, songs, setlists] = await Promise.all([
    fetchLives(),
    fetchSongs(),
    fetchSetlists()
  ]);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">演奏統計</h1>
        <StatsDashboard 
          lives={lives} 
          songs={songs} 
          setlists={setlists}
        />
      </main>
    </div>
  );
}
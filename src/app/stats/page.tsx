// src/app/stats/page.tsx

import { Suspense } from 'react';
import { loadLivesData, loadSongsAndSetlists } from '@/utils/static-data-loader';
import { StatsDashboard } from '@/components/StatsDashboard';

// Static Site Generationのためのデータロード
export async function generateStaticParams() {
  return [{}]; // 静的に生成するパラメータがないので空のオブジェクト
}

export default async function StatsPage() {
  // ビルド時に実行されるデータロード
  const lives = loadLivesData();
  const { songs, setlists } = await loadSongsAndSetlists();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">演奏統計</h1>
        
        <Suspense fallback={<div>Loading statistics...</div>}>
          <StatsDashboard 
            lives={lives} 
            songs={songs} 
            setlists={setlists}
          />
        </Suspense>
      </main>
    </div>
  );
}
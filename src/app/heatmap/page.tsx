// src/app/heatmap/page.tsx

import { Suspense } from 'react';
import { loadLivesData, loadSongsAndSetlists } from '../../utils/static-data-loader';
import { PerformanceHeatmap } from '../../components/PerformanceHeatmap';

// Static Site Generationのためのデータロード
export async function generateStaticParams() {
  return [{}]; // 静的に生成するパラメータがないので空のオブジェクト
}

export default async function HeatmapPage() {
  // ビルド時に実行されるデータロード
  const lives = loadLivesData();
  const { songs, setlists } = await loadSongsAndSetlists();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">演奏頻度ヒートマップ</h1>
      
      <Suspense fallback={<div>Loading heatmap...</div>}>
        <PerformanceHeatmap
          lives={lives}
          songs={songs}
          setlists={setlists}
        />
      </Suspense>
    </div>
  );
}
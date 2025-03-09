// src/app/search/page.tsx

import { Suspense } from 'react';
import { loadLivesData, loadSongsAndSetlists } from '@/utils/static-data-loader';
import AdvancedSearch from '@/components/AdvancedSearch/AdvancedSearch';

// Static Site Generationのためのデータロード
export async function generateStaticParams() {
  return [{}]; // 静的に生成するパラメータがないので空のオブジェクト
}

export default async function SearchPage() {
  // ビルド時に実行されるデータロード
  const lives = loadLivesData();
  const { songs, setlists } = await loadSongsAndSetlists();
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">これまでのライブとセトリ</h1>
      
      <Suspense fallback={<div>Loading search...</div>}>
        <AdvancedSearch
          lives={lives}
          songs={songs}
          setlists={setlists}
        />
      </Suspense>
    </div>
  );
}
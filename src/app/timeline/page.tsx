import { Header } from '@/components/Header/Header';
import { LiveTimeline } from '@/components/LiveTimeline';
import { fetchLives } from '@/utils/api';

export default async function LiveTimelinePage() {
  // サーバーコンポーネントでデータ取得
  const lives = await fetchLives();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">七輪ライブ年表</h1>
        <LiveTimeline lives={lives} />
      </main>
    </div>
  );
}
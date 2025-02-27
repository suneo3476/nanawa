import { Header } from '@/components/Header/Header';
import { PerformanceHeatmap } from '@/components/PerformanceHeatmap';
import { fetchLives, fetchSongs, fetchSetlists } from '@/utils/api';

export const metadata = {
  title: '演奏頻度ヒートマップ | 七輪アーカイブ',
  description: 'aikoコピーバンド「七輪」の曲ごとの演奏頻度をヒートマップで可視化します',
};

export default async function HeatmapPage() {
  // サーバーコンポーネントでデータを取得
  const [lives, songs, setlists] = await Promise.all([
    fetchLives(),
    fetchSongs(),
    fetchSetlists(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">演奏頻度ヒートマップ</h1>
        <p className="text-gray-600 mb-6">
          各楽曲の時期ごとの演奏頻度を色の濃淡で表現。「七輪」のレパートリー変遷を一目で把握できます。
        </p>
        
        <PerformanceHeatmap
          lives={lives}
          songs={songs}
          setlists={setlists}
        />
      </main>
    </div>
  );
}
import { Header } from '@/components/Header/Header';
import AdvancedSearch from '@/components/AdvancedSearch/AdvancedSearch';
import { fetchLives, fetchSongs, fetchSetlists } from '@/utils/api';

export default async function SearchPage() {
  // データを並列で取得
  const [lives, songs, setlists] = await Promise.all([
    fetchLives(),
    fetchSongs(),
    fetchSetlists()
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">詳細検索</h1>
        <AdvancedSearch 
          lives={lives} 
          songs={songs} 
          setlists={setlists} 
        />
      </main>
    </div>
  );
}
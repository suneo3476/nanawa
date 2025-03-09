// src/app/page.tsx

import Link from 'next/link';
import { preloadAllData, loadLivesData } from '@/utils/static-data-loader';

// Static Site Generationのためのデータロード
export async function generateStaticParams() {
  // ビルド時にすべてのデータを事前ロード
  await preloadAllData();
  return [];
}

export default function Home() {
  // データロード（ビルド時に実行される）
  const lives = loadLivesData();
  
  // 最新のライブを取得
  const recentLives = [...lives]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);
  
  // 今後のライブをフィルタリング
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingLives = lives
    .filter(live => {
      const liveDate = new Date(live.date);
      liveDate.setHours(0, 0, 0, 0);
      return liveDate >= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 2);

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12">
        <h1 className="text-4xl font-bold mb-4 text-purple-800">七輪アーカイブ</h1>
        <p className="text-xl text-gray-600">
          aikoコピーバンド「七輪」の20年の軌跡を記録したアーカイブサイトです。
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {upcomingLives.length > 0 && (
          <section className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-purple-800">今後のライブ</h2>
            <div className="space-y-4">
              {upcomingLives.map(live => (
                <Link 
                  href={`/lives/${live.liveId}`} 
                  key={live.liveId}
                  className="block p-4 bg-white rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="font-bold text-purple-700">{live.name}</div>
                  <div className="flex justify-between text-gray-600 mt-2">
                    <span>{live.date}</span>
                    <span>{live.venue}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="bg-gradient-to-br from-orange-100 to-yellow-100 rounded-xl p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-orange-700">アーカイブハイライト</h2>
          <div className="grid grid-cols-1 gap-3">
            <Link 
              href="/heatmap" 
              className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow flex items-center gap-3"
            >
              <div className="bg-orange-100 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
              </div>
              <div>
                <div className="font-bold text-gray-800">演奏頻度ヒートマップ</div>
                <div className="text-sm text-gray-600">曲ごとの演奏頻度を視覚化</div>
              </div>
            </Link>
            
            <Link 
              href="/stats" 
              className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow flex items-center gap-3"
            >
              <div className="bg-orange-100 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                  <path d="M3 3v18h18" />
                  <path d="M18 12V8" />
                  <path d="M12 18V8" />
                  <path d="M6 18v-4" />
                </svg>
              </div>
              <div>
                <div className="font-bold text-gray-800">演奏統計</div>
                <div className="text-sm text-gray-600">20年間の活動を数字で分析</div>
              </div>
            </Link>
            
            <Link 
              href="/search" 
              className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow flex items-center gap-3"
            >
              <div className="bg-orange-100 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <div>
                <div className="font-bold text-gray-800">ライブとセトリ</div> {/* 「詳細検索」から変更 */}
                <div className="text-sm text-gray-600">ライブと演奏曲を確認</div>
              </div>
            </Link>
          </div>
        </section>
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">最近のライブ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentLives.map(live => (
            <Link 
              href={`/lives/${live.liveId}`} 
              key={live.liveId}
              className="block p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="font-bold text-lg text-purple-700">{live.name}</div>
              <div className="flex justify-between text-gray-600 mt-2">
                <span>{live.date}</span>
                <span>{live.venue}</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-4 text-center">
          <Link 
            href="/search" 
            className="inline-block px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
          >
            すべてのライブを見る
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">コンテンツ</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4"> {/* グリッド列数を調整 */}
          <Link 
            href="/search" 
            className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <div className="text-4xl mb-2">🎵</div>
            <div className="font-bold text-lg">ライブとセトリ</div> {/* 「詳細検索」から変更 */}
            <div className="text-sm text-gray-600">全 {lives.length} 件</div>
          </Link>
          
          <Link 
            href="/heatmap" 
            className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <div className="text-4xl mb-2">🔥</div>
            <div className="font-bold text-lg">ヒートマップ</div>
            <div className="text-sm text-gray-600">演奏頻度の可視化</div>
          </Link>
          
          <Link 
            href="/stats" 
            className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <div className="text-4xl mb-2">📊</div>
            <div className="font-bold text-lg">アクティビティ</div>
            <div className="text-sm text-gray-600">活動の全体像</div>
          </Link>
        </div>
      </section>
    </div>
  );
}
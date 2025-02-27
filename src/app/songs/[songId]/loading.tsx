import { Header } from '@/components/Header/Header';

export default function SongDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        {/* タイトルのスケルトン */}
        <div className="h-9 w-64 bg-gray-200 rounded animate-pulse mb-8" />
        
        {/* 基本情報カードのスケルトン */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1" />
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 演奏履歴セクションのスケルトン */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mb-6" />
          
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i}
                className="border-b border-gray-100 last:border-0 pb-6 last:pb-0"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

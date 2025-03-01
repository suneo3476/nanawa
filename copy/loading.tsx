// src/app/stats/loading.tsx

export default function StatsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">演奏統計</h1>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* タイトルのスケルトン */}
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
          
          {/* フィルターのスケルトン */}
          <div className="bg-purple-50 rounded-lg p-4 mb-8">
            <div className="h-6 w-32 bg-purple-200 rounded animate-pulse mb-4" />
            <div className="flex gap-4">
              <div className="h-8 w-full bg-purple-100 rounded animate-pulse" />
            </div>
          </div>
          
          {/* グラフグリッドのスケルトン */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-4">
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="h-80 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* サマリーセクションのスケルトン */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="h-6 w-36 bg-gray-200 rounded animate-pulse mb-4" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-gray-100 p-4 rounded-lg animate-pulse">
                  <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                  <div className="h-8 w-16 bg-gray-300 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
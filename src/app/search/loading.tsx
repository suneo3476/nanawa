// src/app/search/loading.tsx

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse mb-8" />
        
        {/* 検索フォームのスケルトン */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="h-7 w-36 bg-gray-200 rounded animate-pulse mb-6" />
          
          {/* 検索ボックススケルトン */}
          <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse mb-6" />
          
          {/* フィルターオプションスケルトン */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
          
          {/* ボタンエリアスケルトン */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
            <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
        
        {/* 検索結果エリアスケルトン */}
        <div className="space-y-8">
          {/* ライブ検索結果スケルトン */}
          <div>
            <div className="h-8 w-36 bg-gray-200 rounded animate-pulse mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={`live-${i}`} className="bg-white rounded-xl shadow-sm p-6 h-64 animate-pulse" />
              ))}
            </div>
          </div>
          
          {/* 楽曲検索結果スケルトン */}
          <div>
            <div className="h-8 w-36 bg-gray-200 rounded animate-pulse mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={`song-${i}`} className="bg-white rounded-xl shadow-sm p-6 h-48 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
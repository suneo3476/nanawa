import { Header } from '@/components/Header/Header';

export default function SongsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="h-9 w-48 bg-gray-200 rounded animate-pulse mb-8" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6">
              {/* タイトルとアルバム情報のスケルトン */}
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-2">
                  <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-8 w-24 bg-purple-100 rounded-full animate-pulse" />
              </div>

              {/* 演奏履歴のスケルトン */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse mt-1" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse mt-1" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

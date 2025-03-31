// src/app/not-found.tsx

import { Search, Home } from 'lucide-react';
import Link from 'next/link';

export default function AppNotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-2xl mx-auto text-center">
          <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-orange-600" aria-hidden="true" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ページが見つかりません
          </h1>
          
          <p className="text-gray-600 mb-4">
            申し訳ありません。お探しのページは存在しないか、移動した可能性があります。
          </p>

          <p className="text-gray-600 mb-8">
            以下のリンクから、メインコンテンツにアクセスできます。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-purple-600 text-white
                     px-6 py-2 rounded-full hover:bg-purple-700 
                     transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 
                     focus:ring-offset-2"
            >
              <Home size={18} className="mr-2" />
              トップページへ
            </Link>
            <Link
              href="/search"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-white text-purple-600 
                     px-6 py-2 rounded-full border border-purple-600 hover:bg-purple-50 
                     transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 
                     focus:ring-offset-2"
            >
              ライブとセトリへ
            </Link>
            <Link
              href="/stats"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-white text-purple-600 
                     px-6 py-2 rounded-full border border-purple-600 hover:bg-purple-50 
                     transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 
                     focus:ring-offset-2"
            >
              アクティビティへ
            </Link>
            <Link
              href="/heatmap"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-white text-purple-600 
                     px-6 py-2 rounded-full border border-purple-600 hover:bg-purple-50 
                     transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 
                     focus:ring-offset-2"
            >
              ヒートマップへ
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
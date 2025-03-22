// src/app/lives/[liveId]/error.tsx

'use client';

import { useEffect } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function LiveError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをログに出力
    console.error('Live page error:', error);
  }, [error]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 max-w-2xl mx-auto">
      <div className="flex flex-col items-center text-center">
        <div className="bg-red-100 p-3 rounded-full mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" aria-hidden="true" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ライブ情報の取得に失敗しました
        </h1>
        
        <p className="text-gray-600 mb-6">
          申し訳ありません。ライブ情報の読み込み中にエラーが発生しました。
          時間をおいて再度お試しいただくか、別のライブページをご覧ください。
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 
                     transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <RefreshCw size={16} />
            再試行
          </button>
          
          <Link
            href="/search"
            className="flex items-center justify-center gap-2 bg-white text-purple-600 px-6 py-2 rounded-full border border-purple-600 hover:bg-purple-50 
                     transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            ライブ一覧に戻る
          </Link>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-2 rounded-full hover:bg-gray-200 
                     transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <Home size={16} />
            トップページへ
          </Link>
        </div>
        
        {error.digest && (
          <div className="mt-8 text-xs text-gray-500">
            エラーコード: {error.digest}
          </div>
        )}
      </div>
    </div>
  );
}
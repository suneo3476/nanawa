'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Header } from '@/components/Header/Header';

export default function SearchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをログに出力
    console.error('Search page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-2xl mx-auto">
          <div className="flex flex-col items-center text-center">
            <div className="bg-red-100 p-3 rounded-full mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              検索ページの読み込み中にエラーが発生しました
            </h1>
            <p className="text-gray-600 mb-6">
              申し訳ありません。データの取得中に問題が発生しました。
              時間をおいて再度お試しください。
            </p>
            <div className="space-x-4">
              <button
                onClick={() => reset()}
                className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 
                         transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                再試行
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
// src/app/not-found.js

import Link from 'next/link';

export default function NotFound() {
  // サーバーコンポーネントとして、クライアントサイド機能を使わない
  return (
    <div className="container mx-auto py-16 px-4 text-center">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">ページが見つかりません</h1>
        <p className="mb-8 text-gray-600">お探しのページは存在しないか、移動した可能性があります。</p>
        
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-full"
        >
          トップページへ戻る
        </Link>
      </div>
    </div>
  );
}
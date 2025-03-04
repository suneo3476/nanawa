'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function NotFoundPage() {
  const searchParams = useSearchParams();
  const fromPath = searchParams.get('from') || '';
  
  return (
    <div className="container mx-auto py-16 px-4 text-center">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">ページが見つかりません</h1>
        <p className="mb-8 text-gray-600">お探しのページは存在しないか、移動した可能性があります。</p>
        
        {fromPath && (
          <p className="text-sm text-gray-500 mb-4">
            リクエストされたパス: {fromPath}
          </p>
        )}
        
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
        >
          <ArrowLeft size={16} />
          トップページへ戻る
        </Link>
      </div>
    </div>
  );
}
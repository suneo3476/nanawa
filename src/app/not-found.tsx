'use client';

import { Suspense } from 'react';
import NotFoundContent from './NotFoundContent';

export default function NotFoundPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-center">
          <div className="text-xl font-semibold">読み込み中...</div>
        </div>
      </div>
    }>
      <NotFoundContent />
    </Suspense>
  );
}
// src/components/LiveViewIntegrated/LiveViewIntegrated.tsx
'use client';

import { Suspense } from 'react';
import LiveViewContent from './LiveViewContent';
import type { Live } from '@/types/live';

interface LiveViewIntegratedProps {
  lives?: Live[];
}

/**
 * ライブビュー統合コンポーネント
 * Suspenseでラップして安全にuseSearchParamsを使用できるようにする
 */
export default function LiveViewIntegrated({ lives = [] }: LiveViewIntegratedProps) {
  return (
    <div className="live-view-container">
      <Suspense fallback={
        <div className="p-4 animate-pulse">
          <div className="flex justify-end mb-4">
            <div className="h-10 bg-gray-200 rounded-lg w-64"></div>
          </div>
          <div className="space-y-4">
            <div className="h-24 bg-gray-200 rounded-lg w-full"></div>
            <div className="h-24 bg-gray-200 rounded-lg w-full"></div>
            <div className="h-24 bg-gray-200 rounded-lg w-full"></div>
          </div>
        </div>
      }>
        <LiveViewContent lives={lives} />
      </Suspense>
    </div>
  );
}
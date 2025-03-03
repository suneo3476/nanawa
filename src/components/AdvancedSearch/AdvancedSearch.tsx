// components/AdvancedSearch/AdvancedSearch.tsx
'use client';

import { Suspense } from 'react';
import AdvancedSearchContent from './AdvancedSearchContent';
import type { Live } from '@/types/live';
import type { Song } from '@/types/song';
import type { SetlistItem } from '@/types/setlist';

interface AdvancedSearchProps {
  lives?: Live[];
  songs?: Song[];
  setlists?: SetlistItem[];
}

/**
 * 検索機能のラッパーコンポーネント
 * Suspenseでラップして安全にクエリパラメータを使用できるようにする
 */
export default function AdvancedSearch({ lives = [], songs = [], setlists = [] }: AdvancedSearchProps) {
  return (
    <div className="search-container bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4">詳細検索</h2>
      
      <Suspense fallback={
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-1/3 mx-auto mt-4"></div>
          <div className="mt-8">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      }>
        <AdvancedSearchContent 
          lives={lives} 
          songs={songs} 
          setlists={setlists} 
        />
      </Suspense>
    </div>
  );
}
// src/components/AdvancedSearch/SearchResults/LiveSearchResults.tsx
import React from 'react';
import { LiveCard } from '@/components/LiveCard/LiveCard';
import type { Live } from '@/types/live';

interface LiveSearchResultsProps {
  lives: Live[];
  displayCount: number;
  onLoadMore: () => void;
  onLoadAll: () => void;
}

const LiveSearchResults: React.FC<LiveSearchResultsProps> = ({
  lives,
  displayCount,
  onLoadMore,
  onLoadAll
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          ライブ検索結果
          <span className="ml-2 text-sm font-normal text-gray-500">
            {lives.length}件
          </span>
        </h2>
      </div>
      
      {lives.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lives.slice(0, displayCount).map((live) => (
            <LiveCard key={live.id} live={live} />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
          条件に一致するライブが見つかりませんでした。
        </div>
      )}
      
      {lives.length > displayCount && (
        <div className="mt-4 text-center flex justify-center gap-3">
          <button 
            onClick={onLoadMore}
            className="px-4 py-2 text-sm text-purple-600 hover:text-purple-700 border border-purple-200 rounded-full hover:bg-purple-50"
          >
            さらに表示（+{lives.length - displayCount}件）
          </button>
          <button 
            onClick={onLoadAll}
            className="px-4 py-2 text-sm text-orange-600 hover:text-orange-700 border border-orange-200 rounded-full hover:bg-orange-50"
          >
            すべて表示（{lives.length}件）
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveSearchResults;
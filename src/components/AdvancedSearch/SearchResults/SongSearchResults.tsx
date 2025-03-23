// src/components/AdvancedSearch/SearchResults/SongSearchResults.tsx
import React from 'react';
import { SongCard } from '@/components/SongCard/SongCard';
import type { Song } from '@/types/song';

interface SongSearchResultsProps {
  songs: (Song & { playCount: number })[];
  displayCount: number;
  onLoadMore: () => void;
  onLoadAll: () => void;
}

const SongSearchResults: React.FC<SongSearchResultsProps> = ({
  songs,
  displayCount,
  onLoadMore,
  onLoadAll
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          楽曲検索結果
          <span className="ml-2 text-sm font-normal text-gray-500">
            {songs.length}件
          </span>
        </h2>
      </div>
      
      {songs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {songs.slice(0, displayCount).map((song) => (
            <SongCard
              key={song.id}
              song={song}
              stats={{ 
                playCount: song.playCount,
                // Additional stats could be added here if needed
              }}
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
          条件に一致する楽曲が見つかりませんでした。
        </div>
      )}
      
      {songs.length > displayCount && (
        <div className="mt-4 text-center flex justify-center gap-3">
          <button 
            onClick={onLoadMore}
            className="px-4 py-2 text-sm text-purple-600 hover:text-purple-700 border border-purple-200 rounded-full hover:bg-purple-50"
          >
            さらに表示（+{songs.length - displayCount}件）
          </button>
          <button 
            onClick={onLoadAll}
            className="px-4 py-2 text-sm text-orange-600 hover:text-orange-700 border border-orange-200 rounded-full hover:bg-orange-50"
          >
            すべて表示（{songs.length}件）
          </button>
        </div>
      )}
    </div>
  );
};

export default SongSearchResults;
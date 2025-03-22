// src/components/SetlistPreview/SetlistPreview.tsx

'use client';

import React from 'react';
import { Music, ChevronRight } from 'lucide-react';
import { type Song } from '@/types/song';
import { useRouter } from 'next/navigation';

interface SetlistPreviewProps {
  songs: Pick<Song, 'id' | 'title'>[];
  onViewDetails?: () => void;
  liveId?: string;
}

export const SetlistPreview: React.FC<SetlistPreviewProps> = ({ songs, onViewDetails, liveId }) => {
  const router = useRouter();

  if (songs.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
        <div className="flex items-center gap-2" aria-label={`全${songs.length}曲`}>
          <Music aria-hidden="true" size={16} />
          <span>{songs.length}曲</span>
        </div>
        <button
          onClick={() => onViewDetails ? onViewDetails() : liveId && router.push(`/lives/${liveId}`)}
          className="flex items-center gap-1 text-purple-500 hover:text-purple-600 transition-colors"
          aria-label="セットリストの詳細を表示"
        >
          セットリスト詳細
          <ChevronRight aria-hidden="true" size={16} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-xs text-purple-500 font-medium mb-1">TOP</div>
          <div className="text-sm font-medium text-gray-700">{songs[0].title}</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="text-xs text-orange-500 font-medium mb-1">LAST</div>
          <div className="text-sm font-medium text-gray-700">{songs[songs.length - 1].title}</div>
        </div>
      </div>
    </div>
  );
};
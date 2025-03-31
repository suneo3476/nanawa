// src/components/SongCard/SongCard.tsx

'use client';

import React from 'react';
import { Music, Calendar, Disc } from 'lucide-react';
import { type Song } from '@/types/song';

interface SongCardProps {
  song: Song;
  stats: {
    playCount: number;
    firstPlay?: {
      liveName: string;
      date: string;
    };
    lastPlay?: {
      liveName: string;
      date: string;
    };
  };
  onSelect?: (songId: string) => void;
}

export const SongCard: React.FC<SongCardProps> = ({ song, stats, onSelect }) => {
  // id フィールドを使用するよう修正
  return (
    <div 
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer"
      onClick={() => onSelect?.(song.id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-800">{song.title}</h3>
          <div className="flex items-center gap-2 text-gray-500 mt-1">
            <Disc size={16} />
            <span className="text-sm">{song.album}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
          <Music size={16} />
          <span className="text-sm font-medium">{stats.playCount}回演奏</span>
        </div>
      </div>

      {(stats.firstPlay || stats.lastPlay) && (
        <div className="space-y-2 text-sm text-gray-600 border-t border-gray-100 pt-4">
          {stats.firstPlay && (
            <div className="flex items-start gap-2">
              <Calendar size={16} className="text-purple-500 flex-shrink-0 mt-1" />
              <div>
                <div className="font-medium">初演奏</div>
                <div>{stats.firstPlay.date} - {stats.firstPlay.liveName}</div>
              </div>
            </div>
          )}
          {stats.lastPlay && (
            <div className="flex items-start gap-2">
              <Calendar size={16} className="text-orange-500 flex-shrink-0 mt-1" />
              <div>
                <div className="font-medium">最終演奏</div>
                <div>{stats.lastPlay.date} - {stats.lastPlay.liveName}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
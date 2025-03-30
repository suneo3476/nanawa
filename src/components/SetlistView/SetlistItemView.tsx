// src/components/SetlistView/SetlistItemView.tsx

'use client';

import React from 'react';
import Link from 'next/link';
import { Album } from 'lucide-react';
import { YouTubeEmbed } from '@/components/YouTubeEmbed';

interface SetlistItemViewProps {
  order: number;
  songId: string;
  songTitle: string;
  albums: string[];
  isSingle?: boolean;
  memo?: string;
  youtubeUrl?: string;
}

export const SetlistItemView: React.FC<SetlistItemViewProps> = ({
  order,
  songId,
  songTitle,
  albums,
  isSingle,
  memo,
  youtubeUrl
}) => {
  return (
    <div className="py-4">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
          {order}
        </div>
        <div className="flex-1 min-w-0">
          <Link
            href={`/songs/${songId}`}
            className="text-lg font-medium text-gray-900 hover:text-purple-700 transition-colors"
          >
            🎵 {songTitle}
          </Link>
          
          {/* 収録アルバム情報 */}
          {albums && albums.length > 0 ? (
            <div className="mt-1 text-sm text-gray-600 flex items-start gap-2">
              <Album size={14} className="mt-1 flex-shrink-0" />
              <span className="overflow-hidden text-ellipsis">
                {albums.join(', ')}
              </span>
            </div>
          ) : (
            <div className="mt-1 text-sm text-gray-400">
              収録情報なし
            </div>
          )}
          
          {/* メモ欄 */}
          {memo && (
            <p className="mt-1 text-sm text-gray-500">{memo}</p>
          )}
          
          {/* YouTube埋め込み */}
          {youtubeUrl && (
            <YouTubeEmbed 
              url={youtubeUrl} 
              title={`${songTitle}の演奏動画`} 
            />
          )}
        </div>
        {isSingle && (
          <div className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
            シングル曲
          </div>
        )}
      </div>
    </div>
  );
};
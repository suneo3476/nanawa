// src/components/SetlistView/SetlistView.tsx

'use client';

import React from 'react';
import { Music, Album, Calendar } from 'lucide-react';
import Link from 'next/link';

type SetlistItemProps = {
  order: number;
  songId: string;
  songTitle: string;
  albums: string[];
  isSingle?: boolean;
  memo?: string;
};

type SetlistViewProps = {
  setlist: SetlistItemProps[];
  date?: string;
};

export const SetlistView: React.FC<SetlistViewProps> = ({ setlist, date }) => {
  if (!setlist || setlist.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        セットリスト情報がありません
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
        <Music size={16} className="text-purple-500" />
        <span>{setlist.length}曲演奏</span>
        {date && (
          <>
            <span className="mx-1">•</span>
            <Calendar size={16} className="text-purple-500" />
            <time dateTime={date}>{date}</time>
          </>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {setlist.map((item) => (
          <div key={`${item.order}-${item.songId}`} className="py-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                {item.order}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/songs/${item.songId}`}
                  className="text-lg font-medium text-gray-900 hover:text-purple-700"
                >
                  🎵 {item.songTitle}
                </Link>
                
                {/* 収録アルバム情報 - 複数表示に修正 */}
                {item.albums && item.albums.length > 0 ? (
                  <div className="mt-1 text-sm text-gray-600 flex items-start gap-2">
                    <Album size={14} className="mt-1 flex-shrink-0" />
                    <span className="overflow-hidden text-ellipsis">
                      {item.albums.join(', ')}
                    </span>
                  </div>
                ) : (
                  <div className="mt-1 text-sm text-gray-400">
                    収録情報なし
                  </div>
                )}
                
                {/* メモ欄 */}
                {item.memo && (
                  <p className="mt-1 text-sm text-gray-500">{item.memo}</p>
                )}
              </div>
              {item.isSingle && (
                <div className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
                  シングル曲
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
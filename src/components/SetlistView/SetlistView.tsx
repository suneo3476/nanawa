// src/components/SetlistView/SetlistView.tsx

'use client';

import React from 'react';
import { Music, Calendar } from 'lucide-react';
import { SetlistItemView } from './SetlistItemView';

type SetlistItemProps = {
  order: number;
  songId: string;
  songTitle: string;
  albums: string[];
  isSingle?: boolean;
  memo?: string;
  youtubeUrl?: string;
};

type SetlistViewProps = {
  setlist: SetlistItemProps[];
  date?: string;
};

export const SetlistView: React.FC<SetlistViewProps> = ({ setlist, date }) => {
  console.table(setlist);
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
          <SetlistItemView
            key={`${item.order}-${item.songId}`}
            order={item.order}
            songId={item.songId}
            songTitle={item.songTitle}
            albums={item.albums}
            isSingle={item.isSingle}
            memo={item.memo}
            youtubeUrl={item.youtubeUrl}
          />
        ))}
      </div>
    </div>
  );
};
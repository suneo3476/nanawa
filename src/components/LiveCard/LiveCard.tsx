// src/components/LiveCard/LiveCard.tsx

'use client';

import React, { useMemo } from 'react';
import { CalendarDays, MapPin, MessageCircle } from 'lucide-react';
import { type Live } from '@/types/live';
import { type Song } from '@/types/song';
import { SetlistPreview } from '../SetlistPreview/SetlistPreview';
import { useRouter } from 'next/navigation';

interface LiveCardProps {
  live: Live & {
    setlist?: Pick<Song, 'id' | 'title'>[];
  };
  onSelect?: (liveId: string) => void;
}

export const LiveCard: React.FC<LiveCardProps> = ({ live, onSelect }) => {
  const router = useRouter();
  const isUpcoming = useMemo(() => {
    const targetDate = new Date(live.date);
    targetDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return targetDate > today;
  }, [live.date]);

  // ライブ名と会場名の表示を eventName と venueName から取得
  return (
    <div 
      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer"
      onClick={() => onSelect ? onSelect(live.id) : router.push(`/lives/${live.id}`)}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-xl font-bold text-gray-800">{live.eventName}</h3>
        {isUpcoming && (
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
            Coming up
          </span>
        )}
      </div>
      <div className="mt-4 space-y-2 text-gray-600">
        <div className="flex items-center gap-2">
          <CalendarDays aria-hidden="true" size={18} className="text-purple-500" />
          <time dateTime={live.date}>{live.date}</time>
        </div>
        <div className="flex items-center gap-2">
          <MapPin aria-hidden="true" size={18} className="text-purple-500" />
          <span>{live.venueName}</span>
        </div>
        {live.memo && (
          <div className="flex items-start gap-2">
            <MessageCircle aria-hidden="true" size={18} className="text-purple-500" />
            <span className="text-sm">{live.memo}</span>
          </div>
        )}
      </div>
      {live.setlist && (
        <SetlistPreview 
          songs={live.setlist}
          onViewDetails={() => onSelect?.(live.id)}
          liveId={live.id}
        />
      )}
    </div>
  );
};
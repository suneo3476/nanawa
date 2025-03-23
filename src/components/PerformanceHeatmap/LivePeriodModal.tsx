// src/components/PerformanceHeatmap/LivePeriodModal.tsx

import React from 'react';
import { CalendarDays, MapPin, ChevronRight } from 'lucide-react';
import { formatDate } from './utils/HeatmapUtils';
import type { Live } from '@/types/live';
import type { Song } from '@/types/song';

interface LivePeriodModalProps {
  selectedPeriod: {
    song: Song;
    period: string;
    lives: Live[];
  };
  onClose: () => void;
  onLiveClick: (liveId: string) => void;
}

const LivePeriodModal: React.FC<LivePeriodModalProps> = ({ 
  selectedPeriod, 
  onClose, 
  onLiveClick 
}) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        // オーバーレイ部分のクリックでのみ閉じる
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              {selectedPeriod.song.title} - {selectedPeriod.period}
            </h3>
          </div>
          
          <p className="mb-4 text-gray-600">
            この期間に演奏されたライブ {selectedPeriod.lives.length}件
          </p>
          
          <div className="space-y-3">
            {selectedPeriod.lives.map(live => (
              <div
                key={live.id}
                className="p-3 bg-gray-50 hover:bg-purple-100 active:bg-purple-200 rounded-lg cursor-pointer transition-all shadow-sm hover:shadow border border-gray-200 hover:border-purple-300 flex justify-between items-center"
                onClick={() => onLiveClick(live.id)}
              >
                <div>
                  <div className="font-medium">{live.eventName}</div>
                  <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={14} />
                      {formatDate(live.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {live.venueName}
                    </span>
                  </div>
                </div>
                <ChevronRight className="text-purple-400" size={20} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePeriodModal;
// src/components/PerformanceHeatmap/HeatmapOptions.tsx

import React from 'react';
import { Calendar, Music, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { TimeUnit, SortOption } from './utils/HeatmapUtils';

interface HeatmapOptionsProps {
  timeUnit: TimeUnit;
  setTimeUnit: (unit: TimeUnit) => void;
  songLimit: number;
  setSongLimit: (limit: number) => void;
  sortBy: SortOption;
  setSortBy: (option: SortOption) => void;
  yearRange: { start: number; end: number };
  setYearRange: (range: { start: number; end: number }) => void;
  isOptionsCollapsed: boolean;
  setIsOptionsCollapsed: (collapsed: boolean) => void;
  allYears: number[];
}

const HeatmapOptions: React.FC<HeatmapOptionsProps> = ({
  timeUnit,
  setTimeUnit,
  songLimit,
  setSongLimit,
  sortBy,
  setSortBy,
  yearRange,
  setYearRange,
  isOptionsCollapsed,
  setIsOptionsCollapsed,
  allYears
}) => {
  return (
    <>
      {/* 表示オプションのヘッダー（クリックで開閉） */}
      <div 
        className="flex items-center justify-between cursor-pointer mb-3 pb-2 border-b"
        onClick={() => setIsOptionsCollapsed(!isOptionsCollapsed)}
      >
        <div className="font-medium flex items-center gap-2">
          <Filter size={16} className="text-purple-500" />
          <span>表示オプション</span>
        </div>
        <div>
          {isOptionsCollapsed ? (
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronUp size={16} className="text-gray-400" />
          )}
        </div>
      </div>
      
      {/* 表示オプションのコントロールパネル */}
      {!isOptionsCollapsed && (
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 animate-fadeIn">
          {/* 時間単位コントロール */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700 flex items-center gap-2">
              <Calendar size={16} className="text-purple-500" />
              時間単位
            </label>
            <select
              value={timeUnit}
              onChange={(e) => setTimeUnit(e.target.value as TimeUnit)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="year">年別</option>
              <option value="quarter">四半期別</option>
            </select>
          </div>
          
          {/* 表示曲数コントロール */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700 flex items-center gap-2">
              <Music size={16} className="text-purple-500" />
              表示曲数
            </label>
            <select
              value={songLimit}
              onChange={(e) => setSongLimit(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value={10}>10曲</option>
              <option value={20}>20曲</option>
              <option value={50}>50曲</option>
              <option value={100}>100曲</option>
              <option value={200}>全曲表示</option>
            </select>
          </div>
          
          {/* ソート順コントロール */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700 flex items-center gap-2">
              <Filter size={16} className="text-purple-500" />
              並び替え
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="frequency">演奏回数</option>
              <option value="name">曲名</option>
              <option value="album">アルバム</option>
              <option value="lastPlayed">最終演奏日</option>
              <option value="release">リリース年順</option>
            </select>
          </div>
          
          {/* 年範囲コントロール */}
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-medium text-gray-700">期間</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={allYears.length > 0 ? Math.min(...allYears) : 2003}
                max={yearRange.end}
                value={yearRange.start}
                onChange={(e) => setYearRange({ ...yearRange, start: Number(e.target.value) })}
                className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <span className="text-gray-500">～</span>
              <input
                type="number"
                min={yearRange.start}
                max={allYears.length > 0 ? Math.max(...allYears) : new Date().getFullYear()}
                value={yearRange.end}
                onChange={(e) => setYearRange({ ...yearRange, end: Number(e.target.value) })}
                className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HeatmapOptions;
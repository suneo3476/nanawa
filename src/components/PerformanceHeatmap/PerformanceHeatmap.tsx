'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Calendar, Music, Filter } from 'lucide-react';
import type { Live } from '@/types/live';
import type { Song } from '@/types/song';
import type { SetlistItem } from '@/types/setlist';

interface PerformanceHeatmapProps {
  lives: Live[];
  songs: Song[];
  setlists: SetlistItem[];
}

type TimeUnit = 'year' | 'quarter';
type SortOption = 'frequency' | 'name' | 'album';

export const PerformanceHeatmap: React.FC<PerformanceHeatmapProps> = ({
  lives,
  songs,
  setlists,
}) => {
  // 状態管理
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('year');
  const [sortBy, setSortBy] = useState<SortOption>('frequency');
  const [songLimit, setSongLimit] = useState(20);
  const [yearRange, setYearRange] = useState<{ start: number; end: number }>({
    start: 2003,
    end: new Date().getFullYear(),
  });

  // 全期間の計算
  const allPeriods = useMemo(() => {
    const periods = new Set<string>();
    
    lives.forEach(live => {
      const date = new Date(live.date);
      const year = date.getFullYear();
      
      if (timeUnit === 'year') {
        periods.add(year.toString());
      } else {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        periods.add(`${year}-Q${quarter}`);
      }
    });
    
    return Array.from(periods).sort();
  }, [lives, timeUnit]);

  // 曲ごとの期間別演奏回数データの計算
  const heatmapData = useMemo(() => {
    // 表示期間内のライブを絞り込む
    const filteredLives = lives.filter(live => {
      const year = new Date(live.date).getFullYear();
      return year >= yearRange.start && year <= yearRange.end;
    });
    
    const filteredLiveIds = filteredLives.map(live => live.liveId);
    
    // 曲ごとの期間別演奏回数を集計
    const songPeriodCounts: Record<string, Record<string, number>> = {};
    
    // すべての曲とすべての期間で初期化
    songs.forEach(song => {
      songPeriodCounts[song.songId] = {};
      allPeriods.forEach(period => {
        songPeriodCounts[song.songId][period] = 0;
      });
    });
    
    // セットリストから演奏回数を集計
    setlists
      .filter(item => filteredLiveIds.includes(item.liveId))
      .forEach(item => {
        const live = lives.find(l => l.liveId === item.liveId);
        if (!live) return;
        
        const date = new Date(live.date);
        const year = date.getFullYear();
        let period: string;
        
        if (timeUnit === 'year') {
          period = year.toString();
        } else {
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          period = `${year}-Q${quarter}`;
        }
        
        if (songPeriodCounts[item.songId] && period in songPeriodCounts[item.songId]) {
          songPeriodCounts[item.songId][period]++;
        }
      });
    
    // 曲ごとの総演奏回数を計算
    const songTotalCounts: Record<string, number> = {};
    Object.entries(songPeriodCounts).forEach(([songId, periods]) => {
      songTotalCounts[songId] = Object.values(periods).reduce((sum, count) => sum + count, 0);
    });
    
    // 最大演奏回数を見つける（強度の正規化用）
    let maxCount = 0;
    Object.values(songPeriodCounts).forEach(periods => {
      Object.values(periods).forEach(count => {
        maxCount = Math.max(maxCount, count);
      });
    });
    
    // ソート基準に従って曲をソート
    let sortedSongs = [...songs].filter(song => songTotalCounts[song.songId] > 0);
    
    if (sortBy === 'frequency') {
      sortedSongs.sort((a, b) => (songTotalCounts[b.songId] || 0) - (songTotalCounts[a.songId] || 0));
    } else if (sortBy === 'name') {
      sortedSongs.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'album') {
      sortedSongs.sort((a, b) => {
        // アルバム名がない場合は末尾に
        if (!a.album) return 1;
        if (!b.album) return -1;
        return a.album.localeCompare(b.album);
      });
    }
    
    // 表示する曲数を制限
    sortedSongs = sortedSongs.slice(0, songLimit);
    
    // ヒートマップデータを構築
    return sortedSongs.map(song => {
      const periodData = allPeriods
        .filter(period => {
          // 年範囲でフィルタリング
          if (timeUnit === 'year') {
            const year = parseInt(period);
            return year >= yearRange.start && year <= yearRange.end;
          } else {
            const year = parseInt(period.split('-')[0]);
            return year >= yearRange.start && year <= yearRange.end;
          }
        })
        .map(period => {
          const count = songPeriodCounts[song.songId]?.[period] || 0;
          return {
            period,
            count,
            intensity: maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
          };
        });
      
      return {
        song,
        periods: periodData,
        totalCount: songTotalCounts[song.songId] || 0
      };
    });
  }, [lives, songs, setlists, timeUnit, sortBy, songLimit, yearRange, allPeriods]);

  // マウント時に初期設定
  useEffect(() => {
    if (lives.length > 0) {
      const years = lives.map(live => new Date(live.date).getFullYear());
      setYearRange({
        start: Math.min(...years),
        end: Math.max(...years)
      });
    }
  }, [lives]);

  // 強度から背景色を計算する関数
  const getBackgroundColor = (intensity: number): string => {
    if (intensity === 0) return '#f8fafc'; // Tailwind slate-50
    
    // 紫→青のグラデーション (Tailwind colors)
    const colors = [
      '#ede9fe', // violet-100
      '#ddd6fe', // violet-200
      '#c4b5fd', // violet-300
      '#a78bfa', // violet-400
      '#8b5cf6', // violet-500
      '#7c3aed', // violet-600
      '#6d28d9', // violet-700
      '#5b21b6', // violet-800
    ];
    
    // 強度に基づいて色を選択
    const index = Math.min(Math.floor(intensity / 12.5), colors.length - 1);
    return colors[index];
  };

  // 強度からテキスト色を計算する関数（暗い背景には明るい文字）
  const getTextColor = (intensity: number): string => {
    return intensity > 50 ? 'white' : '#1e293b'; // > 50% は白, それ以外は slate-800
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">演奏頻度ヒートマップ</h2>
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 時間単位コントロール */}
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700 flex items-center gap-2">
            <Calendar size={16} />
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
          <label className="mb-2 text-sm font-medium text-gray-700 flex items-center gap-2">
            <Music size={16} />
            表示曲数
          </label>
          <select
            value={songLimit}
            onChange={(e) => setSongLimit(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value={10}>10曲</option>
            <option value={20}>20曲</option>
            <option value={30}>30曲</option>
            <option value={50}>50曲</option>
          </select>
        </div>
        
        {/* ソート順コントロール */}
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700 flex items-center gap-2">
            <Filter size={16} />
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
          </select>
        </div>
        
        {/* 年範囲コントロール */}
        <div className="flex flex-col">
          <label className="mb-2 text-sm font-medium text-gray-700">期間</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={2003}
              max={yearRange.end}
              value={yearRange.start}
              onChange={(e) => setYearRange({ ...yearRange, start: Number(e.target.value) })}
              className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <span className="text-gray-500">～</span>
            <input
              type="number"
              min={yearRange.start}
              max={new Date().getFullYear()}
              value={yearRange.end}
              onChange={(e) => setYearRange({ ...yearRange, end: Number(e.target.value) })}
              className="w-20 border border-gray-300 rounded-lg px-2 py-2 text-center focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>
      
      {/* ヒートマップの凡例 */}
      <div className="mb-4 flex items-center justify-end gap-2">
        <span className="text-xs text-gray-500">演奏回数:</span>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-slate-50 border border-slate-200"></div>
          <span className="text-xs ml-1">0</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-violet-200 border border-slate-200"></div>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-violet-400 border border-slate-200"></div>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-violet-600 border border-slate-200"></div>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-violet-800 border border-slate-200"></div>
          <span className="text-xs ml-1">多</span>
        </div>
      </div>
      
      {/* ヒートマップ本体 */}
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="bg-gray-50 sticky left-0 z-10 text-left py-3 px-4 border-b border-gray-200 font-medium text-gray-700">
                曲名
              </th>
              <th className="bg-gray-50 text-left py-3 px-4 border-b border-gray-200 font-medium text-gray-700 text-center whitespace-nowrap">
                演奏回数
              </th>
              {heatmapData.length > 0 && heatmapData[0].periods.map((period, index) => (
                <th 
                  key={index}
                  className="bg-gray-50 py-3 px-3 border-b border-gray-200 font-medium text-gray-700 text-center whitespace-nowrap"
                >
                  {period.period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmapData.map((row, rowIndex) => (
              <tr key={row.song.songId} className={rowIndex % 2 === 0 ? '' : 'bg-gray-50'}>
                <td className="sticky left-0 z-10 py-4 px-4 border-b border-gray-200 font-medium text-gray-900 bg-inherit">
                  <div className="max-w-xs">
                    <div className="truncate">{row.song.title}</div>
                    {row.song.album && (
                      <div className="text-xs text-gray-500 truncate">
                        {row.song.album}
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-4 px-3 border-b border-gray-200 text-center font-medium">
                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                    {row.totalCount}回
                  </span>
                </td>
                {row.periods.map((period, index) => (
                  <td 
                    key={index}
                    className="py-4 px-3 border-b border-gray-200 text-center transition-all hover:transform hover:scale-110"
                    style={{ 
                      backgroundColor: getBackgroundColor(period.intensity),
                      color: getTextColor(period.intensity)
                    }}
                    title={`${row.song.title} - ${period.period}: ${period.count}回演奏`}
                  >
                    {period.count > 0 ? period.count : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* データがないの場合 */}
      {heatmapData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          表示するデータがありません
        </div>
      )}
    </div>
  );
};
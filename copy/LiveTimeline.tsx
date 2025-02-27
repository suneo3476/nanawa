'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronRight, ChevronLeft, CalendarRange, CalendarDays, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Live } from '@/types/live';

interface LiveTimelineProps {
  lives: Live[];
}

type TimeScale = 'years' | 'months';

export const LiveTimeline: React.FC<LiveTimelineProps> = ({ lives }) => {
  const [timeScale, setTimeScale] = useState<TimeScale>('years');
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);
  const [visibleYearRange, setVisibleYearRange] = useState<[number, number] | null>(null);
  const router = useRouter();
  
  // 全ての年を抽出
  const allYears = useMemo(() => {
    const years = lives.map(live => new Date(live.date).getFullYear());
    const uniqueYears = Array.from(new Set(years)).sort((a, b) => a - b);
    return uniqueYears;
  }, [lives]);
  
  // 初期表示範囲の設定 (最初のマウント時のみ)
  useMemo(() => {
    if (allYears.length > 0 && visibleYearRange === null) {
      const startYear = allYears[0];
      const endYear = allYears[allYears.length - 1];
      setVisibleYearRange([startYear, endYear]);
    }
  }, [allYears, visibleYearRange]);
  
  // 期間でグループ化されたライブ
  const groupedLives = useMemo(() => {
    if (!visibleYearRange) return {};
    
    return lives.reduce<Record<string, Live[]>>((acc, live) => {
      const date = new Date(live.date);
      const year = date.getFullYear();
      
      // 表示範囲外のライブはスキップ
      if (year < visibleYearRange[0] || year > visibleYearRange[1]) {
        return acc;
      }
      
      const key = timeScale === 'years' 
        ? year.toString()
        : `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[key]) acc[key] = [];
      acc[key].push(live);
      return acc;
    }, {});
  }, [lives, timeScale, visibleYearRange]);
  
  // 表示する期間のキー一覧
  const periodKeys = useMemo(() => {
    if (!visibleYearRange) return [];
    
    if (timeScale === 'years') {
      // 年単位の場合は、表示範囲内の全ての年を生成
      const keys: string[] = [];
      for (let year = visibleYearRange[0]; year <= visibleYearRange[1]; year++) {
        keys.push(year.toString());
      }
      return keys;
    } else {
      // 月単位の場合は、ライブが存在する月のみ表示
      return Object.keys(groupedLives).sort();
    }
  }, [timeScale, visibleYearRange, groupedLives]);
  
  // ライブの密度に基づいて高さを取得する関数
  const getHeightForPeriod = useCallback((period: string): string => {
    const lives = groupedLives[period] || [];
    if (lives.length === 0) {
      return '60px'; // 最小高さ
    }
    
    // 最小高さ60px、ライブ1つにつき12px追加（最大200px）
    return `${Math.min(60 + lives.length * 12, 200)}px`;
  }, [groupedLives]);
  
  // 期間ラベルを表示する関数
  const renderPeriodLabel = useCallback((period: string): string => {
    if (timeScale === 'years') {
      return period; // 年はそのまま表示
    } else {
      // 月は "YYYY-MM" 形式から "YYYY年MM月" 形式に変換
      const [year, month] = period.split('-');
      return `${year}年${parseInt(month)}月`;
    }
  }, [timeScale]);
  
  // 期間の密度に基づいて色を取得する関数
  const getColorForPeriod = useCallback((period: string): string => {
    const lives = groupedLives[period] || [];
    if (lives.length === 0) {
      return 'bg-purple-50 border-purple-100'; // ライブがない場合
    } else if (lives.length <= 2) {
      return 'bg-purple-100 border-purple-200'; // 少ない場合
    } else if (lives.length <= 4) {
      return 'bg-purple-200 border-purple-300'; // 中程度
    } else {
      return 'bg-purple-300 border-purple-400'; // 多い場合
    }
  }, [groupedLives]);
  
  // 期間の表示範囲を調整する関数
  const adjustVisibleRange = useCallback((direction: 'prev' | 'next') => {
    if (!visibleYearRange) return;
    
    const [startYear, endYear] = visibleYearRange;
    const range = endYear - startYear;
    const step = Math.max(1, Math.floor(range / 3)); // 範囲の1/3ずつ移動
    
    if (direction === 'prev') {
      const newStart = Math.max(allYears[0], startYear - step);
      const newEnd = newStart + range;
      setVisibleYearRange([newStart, newEnd]);
    } else {
      const newEnd = Math.min(allYears[allYears.length - 1], endYear + step);
      const newStart = newEnd - range;
      setVisibleYearRange([newStart, newEnd]);
    }
    
    // 展開された期間をリセット
    setExpandedPeriod(null);
  }, [visibleYearRange, allYears]);
  
  // 全期間を表示する関数
  const showAllPeriods = useCallback(() => {
    if (allYears.length > 0) {
      setVisibleYearRange([allYears[0], allYears[allYears.length - 1]]);
    }
    setExpandedPeriod(null);
  }, [allYears]);
  
  // ライブをクリックして詳細ページに移動する関数
  const handleLiveClick = useCallback((liveId: string) => {
    router.push(`/lives/${liveId}`);
  }, [router]);
  
  // 日付を表示用にフォーマットする関数
  const formatDate = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  }, []);
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">ライブタイムライン</h2>
      
      {/* コントロールパネル */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              timeScale === 'years' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setTimeScale('years')}
            aria-label="年単位表示"
          >
            <CalendarRange size={18} />
            <span>年単位</span>
          </button>
          <button
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              timeScale === 'months' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setTimeScale('months')}
            aria-label="月単位表示"
          >
            <CalendarDays size={18} />
            <span>月単位</span>
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => adjustVisibleRange('prev')}
            disabled={visibleYearRange && visibleYearRange[0] <= allYears[0]}
            aria-label="前の期間を表示"
          >
            <ChevronLeft size={18} />
          </button>
          {/* 表示期間が全期間と異なる場合のみ表示 */}
          {visibleYearRange && (visibleYearRange[0] > allYears[0] || visibleYearRange[1] < allYears[allYears.length - 1]) && (
            <button
              className="px-4 py-2 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 flex items-center gap-2"
              onClick={showAllPeriods}
              aria-label="全期間を表示"
              title="2003年から2021年までの全期間を表示"
            >
              <span>初期表示に戻す</span>
            </button>
          )}
          <button
            className="px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => adjustVisibleRange('next')}
            disabled={visibleYearRange && visibleYearRange[1] >= allYears[allYears.length - 1]}
            aria-label="次の期間を表示"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      
      {/* 表示範囲情報 */}
      {visibleYearRange && (
        <div className="text-sm text-gray-500 mb-4">
          表示期間: {visibleYearRange[0]}年 ～ {visibleYearRange[1]}年
          {timeScale === 'months' && ' (月別)'}
        </div>
      )}
      
      {/* タイムライン本体 */}
      <div className="space-y-1 mt-4">
        {periodKeys.map(period => {
          const periodLives = groupedLives[period] || [];
          const isExpanded = expandedPeriod === period;
          const hasLives = periodLives.length > 0;
          
          return (
            <div key={period} className="transition-all duration-300">
              {/* 期間ヘッダー（クリックで展開/折りたたみ） */}
              <div 
                className={`flex items-center px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                  hasLives ? getColorForPeriod(period) : 'bg-gray-50 border-gray-100'
                } border`}
                style={{ height: isExpanded ? 'auto' : getHeightForPeriod(period) }}
                onClick={() => setExpandedPeriod(isExpanded ? null : period)}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{renderPeriodLabel(period)}</div>
                  {hasLives && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users size={14} />
                      <span>{periodLives.length}件のライブ</span>
                    </div>
                  )}
                </div>
                {hasLives && (
                  <div className="text-purple-700">
                    {isExpanded ? <ChevronRight className="rotate-90" /> : <ChevronRight />}
                  </div>
                )}
              </div>
              
              {/* 展開されたライブリスト */}
              {isExpanded && periodLives.length > 0 && (
                <div className="pl-8 pr-4 py-3 space-y-2 bg-white border border-t-0 border-gray-200 rounded-b-lg">
                  {periodLives.map(live => (
                    <div 
                      key={live.liveId}
                      className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-purple-50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => handleLiveClick(live.liveId)}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{live.name}</div>
                        <div className="flex flex-wrap gap-x-4 text-sm text-gray-600">
                          <span>{formatDate(live.date)}</span>
                          <span>{live.venue}</span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* データがない場合のメッセージ */}
      {Object.keys(groupedLives).length === 0 && (
        <div className="text-center py-12 text-gray-500">
          表示するライブデータがありません
        </div>
      )}
    </div>
  );
};

export default LiveTimeline;
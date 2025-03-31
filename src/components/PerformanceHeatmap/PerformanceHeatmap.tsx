// src/components/PerformanceHeatmap/PerformanceHeatmap.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import './HeatmapAnimations.css';

// 分割したコンポーネントをインポート
import HeatmapOptions from './HeatmapOptions';
import HeatmapLegend from './HeatmapLegend';
import HeatmapTable from './HeatmapTable';
import LivePeriodModal from './LivePeriodModal';

// ユーティリティ関数と型をインポート
import { 
  TimeUnit, 
  SortOption,
  SelectedPeriod,
  calculateAllPeriods,
  calculateHeatmapData,
  findPeriodLives
} from './utils/HeatmapUtils';

import type { Live } from '@/types/live';
import type { Song } from '@/types/song';
import type { SetlistItem } from '@/types/setlist';

interface PerformanceHeatmapProps {
  lives: Live[];
  songs: Song[];
  setlists: SetlistItem[];
}

export const PerformanceHeatmap: React.FC<PerformanceHeatmapProps> = ({
  lives,
  songs,
  setlists,
}) => {
  const router = useRouter();
  
  // 状態管理
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('year');
  const [sortBy, setSortBy] = useState<SortOption>('lastPlayed');
  const [songLimit, setSongLimit] = useState(200);
  const [yearRange, setYearRange] = useState<{ start: number; end: number }>({
    start: 2003, 
    end: new Date().getFullYear(),
  });
  const [selectedPeriod, setSelectedPeriod] = useState<SelectedPeriod>(null);
  
  // 表示オプションの折りたたみ状態
  const [isOptionsCollapsed, setIsOptionsCollapsed] = useState(true);
  
  // 曲情報のコンパクト表示モード
  const [isCompactMode, setIsCompactMode] = useState(false);

  // 全期間の計算（降順ソート - 新しい順）
  const allPeriods = calculateAllPeriods(lives, timeUnit);

  // 全年データ取得
  const allYears = lives.map(live => new Date(live.date).getFullYear());
  const uniqueYears = Array.from(new Set(allYears));

  // ヒートマップデータの計算
  const heatmapData = calculateHeatmapData(
    songs, 
    lives, 
    setlists, 
    timeUnit, 
    sortBy, 
    songLimit, 
    yearRange, 
    allPeriods
  );

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

  // クリックしたセルの期間×曲のライブを検索するハンドラ
  const handlePeriodClick = (songId: string, periodStr: string) => {
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    const periodLives = findPeriodLives(song, periodStr, timeUnit, lives, setlists);
    
    setSelectedPeriod({
      song,
      period: periodStr,
      lives: periodLives
    });
  };

  // ライブページへ移動する関数
  const handleLiveClick = useCallback((liveId: string) => {
    router.push(`/lives/${liveId}`);
  }, [router]);

  // コンテナ高さの動的計算
  const getHeatmapContainerHeight = useCallback(() => {
    // オプションパネルが開いているかどうかで高さを調整
    const baseHeight = isOptionsCollapsed ? 'calc(100vh - 200px)' : 'calc(100vh - 380px)';
    return baseHeight;
  }, [isOptionsCollapsed]);

  // 表示モード切替のショートカットキー設定とモバイル検出
  useEffect(() => {
    // キーボードショートカット設定
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrlキー + Shift + Cでコンパクトモード切替
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        setIsCompactMode(prev => !prev);
      }
    };
    
    // モバイル端末検出と初期設定
    const checkIfMobile = () => {
      const isMobile = window.innerWidth < 768;
      setIsCompactMode(isMobile); // モバイルならコンパクトモードをデフォルトに
    };
    
    // 初期チェック
    checkIfMobile();
    
    // リサイズイベント設定
    window.addEventListener('resize', checkIfMobile);
    window.addEventListener('keydown', handleKeyDown);
    
    // クリーンアップ
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col h-full overflow-hidden">
      {/* 表示オプションパネル */}
      <HeatmapOptions
        timeUnit={timeUnit}
        setTimeUnit={setTimeUnit}
        songLimit={songLimit}
        setSongLimit={setSongLimit}
        sortBy={sortBy}
        setSortBy={setSortBy}
        yearRange={yearRange}
        setYearRange={setYearRange}
        isOptionsCollapsed={isOptionsCollapsed}
        setIsOptionsCollapsed={setIsOptionsCollapsed}
        allYears={uniqueYears}
      />
      
      {/* ヒートマップの凡例 */}
      <HeatmapLegend />
      
      {/* ヒートマップテーブル */}
      <HeatmapTable
        heatmapData={heatmapData}
        isCompactMode={isCompactMode}
        setIsCompactMode={setIsCompactMode}
        onCellClick={handlePeriodClick}
        containerHeight={getHeatmapContainerHeight()}
      />
      
      {/* ライブ一覧ポップアップ */}
      {selectedPeriod && (
        <LivePeriodModal
          selectedPeriod={selectedPeriod}
          onClose={() => setSelectedPeriod(null)}
          onLiveClick={handleLiveClick}
        />
      )}
    </div>
  );
};
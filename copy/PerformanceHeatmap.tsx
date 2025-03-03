// src/components/PerformanceHeatmap/PerformanceHeatmap.tsx

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronRight, Calendar, Music, Filter, X, MapPin, ChevronDown, ChevronUp, Maximize, Minimize } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Live } from '@/types/live';
import type { Song } from '@/types/song';
import type { SetlistItem } from '@/types/setlist';

interface PerformanceHeatmapProps {
  lives: Live[];
  songs: Song[];
  setlists: SetlistItem[];
}

type TimeUnit = 'year' | 'quarter';
type SortOption = 'frequency' | 'name' | 'album' | 'lastPlayed' | 'release';

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
  const [selectedPeriod, setSelectedPeriod] = useState<{
    song: Song;
    period: string;
    lives: Live[];
  } | null>(null);
  
  // 表示オプションの折りたたみ状態
  const [isOptionsCollapsed, setIsOptionsCollapsed] = useState(true);
  
  // 曲情報のコンパクト表示モード
  const [isCompactMode, setIsCompactMode] = useState(false);

  // 全期間の計算（降順ソート - 新しい順）
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
    
    // 降順ソート（新しい順）
    return Array.from(periods).sort((a, b) => b.localeCompare(a));
  }, [lives, timeUnit]);

  // 最終演奏日を計算する関数
  const getLastPlayedDate = useCallback((songId: string): Date | null => {
    const songSetlists = setlists.filter(item => item.songId === songId);
    if (songSetlists.length === 0) return null;
    
    const liveDates = songSetlists.map(item => {
      const live = lives.find(l => l.liveId === item.liveId);
      return live ? new Date(live.date) : null;
    }).filter(Boolean) as Date[];
    
    if (liveDates.length === 0) return null;
    return new Date(Math.max(...liveDates.map(d => d.getTime())));
  }, [setlists, lives]);

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
    } else if (sortBy === 'lastPlayed') {
      sortedSongs.sort((a, b) => {
        const dateA = getLastPlayedDate(a.songId);
        const dateB = getLastPlayedDate(b.songId);
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return dateB.getTime() - dateA.getTime();
      });
    } else if (sortBy === 'release') {
      // リリース年でソート（古い順）
      sortedSongs.sort((a, b) => {
        if (!a.releaseDate) return 1;
        if (!b.releaseDate) return -1;
        return new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
      });
    }
    
    // 表示する曲数を制限（songLimitが200以上の場合は全曲表示）
    if (songLimit < 200) {
      sortedSongs = sortedSongs.slice(0, songLimit);
    }
    
    // ヒートマップデータを構築
    return sortedSongs.map(song => {
      // 曲のリリース年を取得（YYYY-MM-DD または YYYY形式の場合に対応）
      let releaseYear: number | null = null;
      if (song.releaseDate) {
        try {
          releaseYear = new Date(song.releaseDate).getFullYear();
        } catch (e) {
          console.warn(`Invalid release date for ${song.title}: ${song.releaseDate}`);
        }
      }

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
          
          // 期間が曲のリリース前かどうかを判定
          let isBeforeRelease = false;
          if (releaseYear !== null) {
            const periodYear = timeUnit === 'year' 
                              ? parseInt(period) 
                              : parseInt(period.split('-')[0]);
            isBeforeRelease = periodYear < releaseYear;
          }
          
          return {
            period,
            count,
            intensity: maxCount > 0 ? Math.round((count / maxCount) * 100) : 0,
            isBeforeRelease
          };
        });
      
      return {
        song,
        periods: periodData,
        totalCount: songTotalCounts[song.songId] || 0,
        releaseYear
      };
    });
  }, [lives, songs, setlists, timeUnit, sortBy, songLimit, yearRange, allPeriods, getLastPlayedDate]);

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
  const getBackgroundColor = (intensity: number, isBeforeRelease: boolean): string => {
    // リリース前の場合はより濃いグレー表示（コントラスト強化）
    if (isBeforeRelease) {
      return '#cbd5e1'; // Tailwind slate-300
    }
    
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
  const getTextColor = (intensity: number, isBeforeRelease: boolean): string => {
    if (isBeforeRelease) {
      return '#334155'; // Tailwind slate-700 (より濃いテキスト色)
    }
    return intensity > 50 ? 'white' : '#1e293b'; // > 50% は白, それ以外は slate-800
  };

  // 回数に応じたドットの表示を生成する関数
  const getDotsForCount = (count: number, isBeforeRelease: boolean): React.ReactNode => {
    if (count === 0) return '';
    
    // 最大10個まで対応
    const displayCount = Math.min(count, 10);
    
    // ドットの色
    const dotColor = isBeforeRelease ? 'text-slate-600' : 'text-white';
    
    // 1個または2個の場合は1段に表示
    if (displayCount <= 2) {
      return (
        <div className="flex justify-center gap-1">
          {Array(displayCount).fill(0).map((_, i) => (
            <span key={i} className={dotColor}>●</span>
          ))}
        </div>
      );
    }
    
    // 3個以上は2段に分けて表示
    const topRow = Math.ceil(displayCount / 2); // 上段のドット数
    const bottomRow = displayCount - topRow;    // 下段のドット数
    
    return (
      <div>
        <div className="flex justify-center gap-1">
          {Array(topRow).fill(0).map((_, i) => (
            <span key={`top-${i}`} className={dotColor}>●</span>
          ))}
        </div>
        <div className="flex justify-center gap-1 mt-1">
          {Array(bottomRow).fill(0).map((_, i) => (
            <span key={`bottom-${i}`} className={dotColor}>●</span>
          ))}
        </div>
      </div>
    );
  };

  // 日付をフォーマットする関数
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  // クリックしたセルの期間×曲のライブを検索するハンドラ
  const handlePeriodClick = (song: Song, periodData: { period: string; count: number; isBeforeRelease?: boolean }) => {
    if (periodData.count === 0) return;
    
    // この曲のこの期間に行われたライブを検索
    const periodLives = lives.filter(live => {
      const date = new Date(live.date);
      const year = date.getFullYear().toString();
      
      // 期間判定（年単位または四半期単位）
      let matchesPeriod;
      if (timeUnit === 'year') {
        matchesPeriod = year === periodData.period;
      } else {
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        matchesPeriod = `${year}-Q${quarter}` === periodData.period;
      }
      
      if (!matchesPeriod) return false;
      
      // この曲が演奏されたライブか確認
      return setlists.some(item => 
        item.liveId === live.liveId && item.songId === song.songId
      );
    });
    
    setSelectedPeriod({
      song,
      period: periodData.period,
      lives: periodLives
    });
  };

  // コンテナ高さの動的計算
  const getHeatmapContainerStyle = () => {
    // オプションパネルが開いているかどうかで高さを調整
    const baseHeight = isOptionsCollapsed ? 'calc(100vh - 200px)' : 'calc(100vh - 380px)';
    
    return {
      height: baseHeight,
      minHeight: isOptionsCollapsed ? '500px' : '300px',
    };
  };

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
      )}
      
      {/* ヒートマップの凡例 */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-1 text-xs">
        <div className="flex items-center gap-1 text-xs text-gray-600">
          <span className="text-gray-500">リリース前：</span>
          <div className="w-3 h-3 bg-slate-300 border border-slate-400"></div>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-gray-500 text-xs">演奏回数:</span>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-slate-50 border border-slate-200"></div>
            <span className="text-xs ml-0.5">0</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-violet-200 border border-slate-200"></div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-violet-400 border border-slate-200"></div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-violet-600 border border-slate-200"></div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-violet-800 border border-slate-200"></div>
            <span className="text-xs ml-0.5">多</span>
          </div>
        </div>
      </div>
      
      {/* モバイル最適化したヒートマップテーブル */}
      <div 
        className="overflow-auto heatmap-container flex-grow px-1"
        style={getHeatmapContainerStyle()}
      >
        <table className="min-w-full border-collapse heatmap-table">
          <thead>
            <tr>
              <th 
                style={{ 
                  position: 'sticky', 
                  top: 0, 
                  left: 0, 
                  zIndex: 30,
                  backgroundColor: '#f9fafb',
                  minWidth: isCompactMode ? '50px' : '110px',
                  width: isCompactMode ? '50px' : '110px',
                }}
                className="py-2 px-2 border-b border-r border-gray-200 font-medium text-gray-700 whitespace-nowrap"
              >
                <div className="flex items-center justify-center gap-1">
                  {!isCompactMode && (
                    <span className="md:hidden">曲情報</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCompactMode(!isCompactMode);
                    }}
                    className="text-gray-400 hover:text-purple-600 rounded-full p-1 hover:bg-purple-50"
                    title={isCompactMode ? "詳細表示に切り替え" : "コンパクト表示に切り替え"}
                  >
                    {isCompactMode ? (
                      <Maximize size={16} />
                    ) : (
                      <Minimize size={16} />
                    )}
                  </button>
                  <span className="hidden md:inline">演奏回数</span>
                </div>
              </th>
              <th 
                style={{ 
                  position: 'sticky', 
                  top: 0, 
                  left: '110px', 
                  zIndex: 30,
                  backgroundColor: '#f9fafb',
                  minWidth: '180px',
                }}
                className="text-left py-2 px-4 border-b border-r border-gray-200 font-medium text-gray-700 hidden md:table-cell"
              >
                曲名
              </th>
              {heatmapData.length > 0 && heatmapData[0].periods.map((period, index) => (
                <th 
                  key={index}
                  style={{ 
                    position: 'sticky', 
                    top: 0, 
                    zIndex: 20,
                    backgroundColor: '#f9fafb',
                    width: '60px',
                    minWidth: '60px',
                  }}
                  className="py-2 px-1 border-b border-gray-200 font-medium text-gray-700 text-center whitespace-nowrap"
                >
                  {period.period}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {heatmapData.map((row, rowIndex) => (
              <tr key={row.song.songId} className={rowIndex % 2 === 0 ? '' : 'bg-gray-50'}>
                <td 
                  style={{ 
                    position: 'sticky', 
                    left: 0, 
                    zIndex: 10,
                    backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f9fafb',
                    width: isCompactMode ? '50px' : '110px',
                    minWidth: isCompactMode ? '50px' : '110px',
                    textAlign: isCompactMode ? 'center' : 'left',
                  }}
                  className="py-2 px-1 border-b border-r border-gray-200"
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => router.push(`/songs/${row.song.songId}`)}
                  >
                    {isCompactMode ? (
                      // コンパクトモード - 曲名のみを縦書きで表示
                      <div className="vertical-text text-xs text-purple-800 font-medium h-24 w-full flex items-center justify-center text-center">
                        {row.song.title}
                      </div>
                    ) : (
                      // 通常モード
                      <>
                        {/* モバイル表示時は情報を縦に並べてコンパクトに */}
                        <div className="md:hidden space-y-1">
                          <div className="flex justify-center">
                            <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded-full">
                              {row.totalCount}回
                            </span>
                          </div>
                          <div className="font-medium text-purple-800 text-center truncate text-sm">{row.song.title}</div>
                          {row.releaseYear && (
                            <div className="text-xs text-gray-600 text-center">{row.releaseYear}</div>
                          )}
                          {row.song.album && (
                            <div className="text-xs text-gray-500 text-center truncate">
                              {row.song.album}
                            </div>
                          )}
                        </div>
                        
                        {/* デスクトップ表示時は演奏回数のみ */}
                        <div className="hidden md:flex md:justify-center">
                          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                            {row.totalCount}回
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </td>
                <td 
                  style={{ 
                    position: 'sticky', 
                    left: '110px', 
                    zIndex: 10,
                    backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f9fafb',
                    minWidth: '180px',
                  }}
                  className="py-4 px-4 border-b border-r border-gray-200 font-medium text-gray-900 cursor-pointer hover:text-purple-700 hidden md:table-cell"
                  onClick={() => router.push(`/songs/${row.song.songId}`)}
                >
                  <div className="max-w-xs">
                    {/* 曲名 */}
                    <div className="font-medium truncate text-purple-800">
                      {row.song.title}
                    </div>
                    
                    {/* 初リリース年 */}
                    {row.releaseYear && (
                      <div className="text-xs text-gray-600">
                        {row.releaseYear}
                      </div>
                    )}
                    
                    {/* 初リリース時のディスコグラフィ名とカテゴリ */}
                    {row.song.album && (
                      <div className="text-xs text-gray-500 truncate">
                        {row.song.album}
                        {row.song.firstRelease?.category && (
                          <span className="text-gray-400">
                            （{row.song.firstRelease.category}）
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                {row.periods.map((period, index) => (
                  <td 
                    key={index}
                    className={`py-2 px-1 border-b border-gray-200 text-center ${period.count > 0 ? 'hover:transform hover:scale-110 cursor-pointer transition-all' : ''}`}
                    style={{ 
                      backgroundColor: getBackgroundColor(period.intensity, period.isBeforeRelease),
                      color: getTextColor(period.intensity, period.isBeforeRelease),
                      width: '60px',
                      minWidth: '60px',
                    }}
                    title={`${row.song.title} - ${period.period}: ${period.count}回演奏 ${period.isBeforeRelease ? '(リリース前)' : ''}`}
                    onClick={() => period.count > 0 && handlePeriodClick(row.song, period)}
                  >
                    {period.count > 0 ? (
                      <div className="flex flex-col items-center">
                        {getDotsForCount(period.count, period.isBeforeRelease)}
                        <div className="text-xs opacity-80 mt-0.5">({period.count})</div>
                      </div>
                    ) : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* データがない場合 */}
      {heatmapData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          表示するデータがありません
        </div>
      )}
      
      {/* ライブ一覧ポップアップ */}
      {selectedPeriod && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            // オーバーレイ部分のクリックでのみ閉じる
            if (e.target === e.currentTarget) {
              setSelectedPeriod(null);
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
                    key={live.liveId}
                    className="p-3 bg-gray-50 hover:bg-purple-100 active:bg-purple-200 rounded-lg cursor-pointer transition-all shadow-sm hover:shadow border border-gray-200 hover:border-purple-300 flex justify-between items-center"
                    onClick={() => {
                      router.push(`/lives/${live.liveId}`);
                      setSelectedPeriod(null);
                    }}
                  >
                    <div>
                      <div className="font-medium">{live.name}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(live.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {live.venue}
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
      )}
      
      {/* アニメーション用のグローバルスタイル */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        /* ヒートマップコンテナの高さは動的に調整 */
        .heatmap-container {
          scrollbar-width: thin;
        }
        
        /* スクロールバーのカスタマイズ */
        .heatmap-container::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        .heatmap-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        .heatmap-container::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        
        .heatmap-container::-webkit-scrollbar-thumb:hover {
          background: #9333ea;
        }
        
        /* 縦書きテキスト用のスタイル */
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-height: 130px;
          margin: 0 auto;
          line-height: 1.2;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
};
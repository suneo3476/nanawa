// src/components/PerformanceHeatmap/utils/HeatmapUtils.ts

import type { Live } from '@/types/live';
import type { Song } from '@/types/song';
import type { SetlistItem } from '@/types/setlist';

export type TimeUnit = 'year' | 'quarter';
export type SortOption = 'frequency' | 'name' | 'album' | 'lastPlayed' | 'release';

export type PeriodData = {
  period: string;
  count: number;
  intensity: number;
  isBeforeRelease: boolean;
};

export type SongHeatmapData = {
  song: Song;
  periods: PeriodData[];
  totalCount: number;
  releaseYear: number | null;
};

export type SelectedPeriod = {
  song: Song;
  period: string;
  lives: Live[];
} | null;

// 強度から背景色を計算する関数
export const getBackgroundColor = (intensity: number, isBeforeRelease: boolean): string => {
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
export const getTextColor = (intensity: number, isBeforeRelease: boolean): string => {
  if (isBeforeRelease) {
    return '#334155'; // Tailwind slate-700 (より濃いテキスト色)
  }
  return intensity > 50 ? 'white' : '#1e293b'; // > 50% は白, それ以外は slate-800
};

// ドット表示の情報を生成する関数
export interface DotsDisplayInfo {
  displayCount: number;
  dotColor: string;
  singleRow: boolean;
  topRowCount?: number;
  bottomRowCount?: number;
}

// 回数に応じたドット表示情報を生成する関数
export const getDotsDisplayInfo = (count: number, isBeforeRelease: boolean): DotsDisplayInfo | null => {
  if (count === 0) return null;
  
  // 最大10個まで対応
  const displayCount = Math.min(count, 10);
  
  // ドットの色
  const dotColor = isBeforeRelease ? 'text-slate-600' : 'text-white';
  
  // 1個または2個の場合は1段に表示
  if (displayCount <= 2) {
    return {
      displayCount,
      dotColor,
      singleRow: true
    };
  }
  
  // 3個以上は2段に分けて表示
  const topRowCount = Math.ceil(displayCount / 2); // 上段のドット数
  const bottomRowCount = displayCount - topRowCount; // 下段のドット数
  
  return {
    displayCount,
    dotColor,
    singleRow: false,
    topRowCount,
    bottomRowCount
  };
};

// 日付をフォーマットする関数
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
};

// 全期間を計算する関数
export const calculateAllPeriods = (
  lives: Live[], 
  timeUnit: TimeUnit
): string[] => {
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
};

// 最終演奏日を計算する関数
export const getLastPlayedDate = (
  songId: string, 
  setlists: SetlistItem[], 
  lives: Live[]
): Date | null => {
  const songSetlists = setlists.filter(item => item.songId === songId);
  if (songSetlists.length === 0) return null;
  
  const liveDates = songSetlists.map(item => {
    const live = lives.find(l => l.id === item.liveId);
    return live ? new Date(live.date) : null;
  }).filter(Boolean) as Date[];
  
  if (liveDates.length === 0) return null;
  return new Date(Math.max(...liveDates.map(d => d.getTime())));
};

// ヒートマップデータの計算
export const calculateHeatmapData = (
  songs: Song[],
  lives: Live[],
  setlists: SetlistItem[],
  timeUnit: TimeUnit,
  sortBy: SortOption,
  songLimit: number,
  yearRange: { start: number; end: number },
  allPeriods: string[]
): SongHeatmapData[] => {
  // 表示期間内のライブを絞り込む
  const filteredLives = lives.filter(live => {
    const year = new Date(live.date).getFullYear();
    return year >= yearRange.start && year <= yearRange.end;
  });
  
  const filteredLiveIds = filteredLives.map(live => live.id);
  
  // 曲ごとの期間別演奏回数を集計
  const songPeriodCounts: Record<string, Record<string, number>> = {};
  
  // すべての曲とすべての期間で初期化
  songs.forEach(song => {
    songPeriodCounts[song.id] = {};
    allPeriods.forEach(period => {
      songPeriodCounts[song.id][period] = 0;
    });
  });
  
  // セットリストから演奏回数を集計
  setlists
    .filter(item => filteredLiveIds.includes(item.liveId))
    .forEach(item => {
      const live = lives.find(l => l.id === item.liveId);
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
  let sortedSongs = [...songs].filter(song => songTotalCounts[song.id] > 0);
  
  if (sortBy === 'frequency') {
    sortedSongs.sort((a, b) => (songTotalCounts[b.id] || 0) - (songTotalCounts[a.id] || 0));
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
      const dateA = getLastPlayedDate(a.id, setlists, lives);
      const dateB = getLastPlayedDate(b.id, setlists, lives);
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
        const count = songPeriodCounts[song.id]?.[period] || 0;
        
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
      totalCount: songTotalCounts[song.id] || 0,
      releaseYear
    };
  });
};

// この曲のこの期間に行われたライブを検索
export const findPeriodLives = (
  song: Song, 
  period: string, 
  timeUnit: TimeUnit, 
  lives: Live[], 
  setlists: SetlistItem[]
): Live[] => {
  return lives.filter(live => {
    const date = new Date(live.date);
    const year = date.getFullYear().toString();
    
    // 期間判定（年単位または四半期単位）
    let matchesPeriod;
    if (timeUnit === 'year') {
      matchesPeriod = year === period;
    } else {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      matchesPeriod = `${year}-Q${quarter}` === period;
    }
    
    if (!matchesPeriod) return false;
    
    // この曲が演奏されたライブか確認
    return setlists.some(item => 
      item.liveId === live.id && item.songId === song.id
    );
  });
};
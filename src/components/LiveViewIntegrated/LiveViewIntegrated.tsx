// src/components/LiveViewIntegrated/LiveViewIntegrated.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, List, SlidersHorizontal, Search } from 'lucide-react';
import { LiveTimeline } from '@/components/LiveTimeline';
import { LiveListClient } from '@/components/LiveList/LiveListClient';
// useSearchParams と usePathname を削除
import type { Live } from '@/types/live';
import type { Song } from '@/types/song';

type ViewMode = 'list' | 'timeline';

interface LiveViewIntegratedProps {
  lives: (Live & {
    setlist?: Pick<Song, 'songId' | 'title'>[];
  })[];
}

export const LiveViewIntegrated: React.FC<LiveViewIntegratedProps> = ({ lives }) => {
  // ビューモードの状態管理
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // フィルタリング用の状態
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [venueFilter, setVenueFilter] = useState<string | null>(null);
  
  // 初期ロード時にlocalStorageからビューモードを読み込む
  useEffect(() => {
    try {
      const savedViewMode = localStorage.getItem('liveViewMode');
      if (savedViewMode === 'list' || savedViewMode === 'timeline') {
        setViewMode(savedViewMode as ViewMode);
      }
      
      // 保存されたフィルター設定も読み込む（オプション）
      const savedQuery = localStorage.getItem('liveViewQuery');
      if (savedQuery) setSearchQuery(savedQuery);
      
      const savedYear = localStorage.getItem('liveViewYear');
      if (savedYear) setYearFilter(parseInt(savedYear));
      
      const savedVenue = localStorage.getItem('liveViewVenue');
      if (savedVenue) setVenueFilter(savedVenue);
    } catch (error) {
      console.error('LocalStorage error:', error);
    }
  }, []);
  
  // ビューモード変更時にlocalStorageに保存
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('liveViewMode', mode);
    } catch (error) {
      console.error('LocalStorage error:', error);
    }
  };
  
  // フィルター設定をlocalStorageに保存する関数
  const saveFiltersToStorage = (
    query: string, 
    year: number | null, 
    venue: string | null
  ) => {
    try {
      if (query) localStorage.setItem('liveViewQuery', query);
      else localStorage.removeItem('liveViewQuery');
      
      if (year) localStorage.setItem('liveViewYear', year.toString());
      else localStorage.removeItem('liveViewYear');
      
      if (venue) localStorage.setItem('liveViewVenue', venue);
      else localStorage.removeItem('liveViewVenue');
    } catch (error) {
      console.error('LocalStorage error:', error);
    }
  };
  
  // フィルタリングされたライブデータ
  const filteredLives = useMemo(() => {
    return lives.filter(live => {
      // 検索クエリでフィルタリング
      if (searchQuery && !live.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !live.venue.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // 年でフィルタリング
      if (yearFilter) {
        const liveYear = new Date(live.date).getFullYear();
        if (liveYear !== yearFilter) {
          return false;
        }
      }
      
      // 会場でフィルタリング
      if (venueFilter && live.venue !== venueFilter) {
        return false;
      }
      
      return true;
    });
  }, [lives, searchQuery, yearFilter, venueFilter]);
  
  // 利用可能な年と会場のリストを計算
  const availableYears = useMemo(() => Array.from(new Set(lives.map(live => 
    new Date(live.date).getFullYear()
  ))).sort((a, b) => b - a), [lives]); // 新しい年順
  
  const availableVenues = useMemo(() => Array.from(new Set(lives.map(live => live.venue))).sort(), [lives]);
  
  // モバイル向けの分岐とヘルプコンテンツ
  const [showViewHelp, setShowViewHelp] = useState(false);
  
  return (
    <div className="space-y-6">
      {/* ビュー切り替えとフィルターコントロール */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleViewModeChange('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'list' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            aria-label="リスト表示"
            aria-pressed={viewMode === 'list'}
          >
            <List size={18} />
            <span className="md:inline hidden">リスト</span>
          </button>
          <button
            onClick={() => handleViewModeChange('timeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'timeline' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            aria-label="タイムライン表示"
            aria-pressed={viewMode === 'timeline'}
          >
            <Calendar size={18} />
            <span className="md:inline hidden">タイムライン</span>
          </button>
          
          <button
            onClick={() => setShowViewHelp(!showViewHelp)}
            className="ml-1 text-gray-400 hover:text-gray-600"
            aria-label="表示モードについて"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="ライブ名・会場を検索..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                saveFiltersToStorage(e.target.value, yearFilter, venueFilter);
              }}
              className="pl-9 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none w-full"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg flex-shrink-0 ${
              showFilters || yearFilter || venueFilter 
                ? 'bg-purple-100 text-purple-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            aria-label="詳細フィルター"
            aria-expanded={showFilters}
            title="詳細フィルター"
          >
            <SlidersHorizontal size={18} />
            <span className="sr-only">詳細フィルター</span>
          </button>
        </div>
      </div>
      
      {/* 詳細フィルターパネル */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">年で絞り込み</label>
            <select
              value={yearFilter || ''}
              onChange={(e) => {
                const newValue = e.target.value ? parseInt(e.target.value) : null;
                setYearFilter(newValue);
                saveFiltersToStorage(searchQuery, newValue, venueFilter);
              }}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">すべての年</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">会場で絞り込み</label>
            <select
              value={venueFilter || ''}
              onChange={(e) => {
                const newValue = e.target.value || null;
                setVenueFilter(newValue);
                saveFiltersToStorage(searchQuery, yearFilter, newValue);
              }}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">すべての会場</option>
              {availableVenues.map(venue => (
                <option key={venue} value={venue}>{venue}</option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2">
            <button
              onClick={() => {
                // 状態をリセット
                setYearFilter(null);
                setVenueFilter(null);
                setSearchQuery('');
                
                // localStorageから削除
                saveFiltersToStorage('', null, null);
              }}
              className="px-4 py-2 text-purple-600 hover:text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-50"
            >
              フィルターをクリア
            </button>
          </div>
        </div>
      )}
      
      {/* 表示モードのヘルプ */}
      {showViewHelp && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800">
          <h3 className="font-bold mb-2">表示モードについて</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="font-medium mb-1 flex items-center gap-2">
                <List size={16} />
                リスト表示
              </div>
              <p>すべてのライブをカード形式で一覧表示します。素早く概要を確認したい場合に最適です。</p>
            </div>
            <div>
              <div className="font-medium mb-1 flex items-center gap-2">
                <Calendar size={16} />
                タイムライン表示
              </div>
              <p>年月ごとにライブを時系列に整理して表示します。時間軸で活動を把握したい場合に役立ちます。</p>
            </div>
          </div>
          <div className="mt-2 text-xs">
            ※ 選択した表示モードは保存され、次回も同じ表示で開始されます。
          </div>
        </div>
      )}
      
      {/* 検索結果サマリー */}
      {(searchQuery || yearFilter || venueFilter) && (
        <div className="bg-purple-50 p-3 rounded-lg text-sm text-purple-800">
          <span className="font-medium">{filteredLives.length}件</span>のライブが見つかりました
          {searchQuery && <span>（検索：{searchQuery}）</span>}
          {yearFilter && <span>（年：{yearFilter}年）</span>}
          {venueFilter && <span>（会場：{venueFilter}）</span>}
        </div>
      )}
      
      {/* コンテンツ表示エリア */}
      <div>
        {filteredLives.length > 0 ? (
          viewMode === 'list' ? (
            <LiveListClient lives={filteredLives} />
          ) : (
            <LiveTimeline lives={filteredLives} />
          )
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            条件に一致するライブが見つかりませんでした。
          </div>
        )}
      </div>
    </div>
  );
};
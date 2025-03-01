// src/components/LiveViewIntegrated/LiveViewIntegrated.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, List, SlidersHorizontal, Search } from 'lucide-react';
import { LiveTimeline } from '@/components/LiveTimeline';
import { LiveListClient } from '@/components/LiveList/LiveListClient';
import { useSearchParams, usePathname } from 'next/navigation';
import type { Live } from '@/types/live';
import type { Song } from '@/types/song';

type ViewMode = 'list' | 'timeline';

interface LiveViewIntegratedProps {
  lives: (Live & {
    setlist?: Pick<Song, 'songId' | 'title'>[];
  })[];
}

export const LiveViewIntegrated: React.FC<LiveViewIntegratedProps> = ({ lives }) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // ビューモードの状態管理
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  
  // フィルタリング用の状態
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [yearFilter, setYearFilter] = useState<number | null>(null);
  const [venueFilter, setVenueFilter] = useState<string | null>(null);
  
  // URLのクエリパラメータを監視し、変更があればビューモードを更新
  useEffect(() => {
    // next/navigationのuseSearchParamsを使用
    const viewParam = searchParams.get('view');
    
    if (viewParam === 'timeline' || viewParam === 'list') {
      // URLパラメータに基づいてビューモードを設定
      setViewMode(viewParam);
      // ローカルストレージにも保存
      try {
        localStorage.setItem('liveViewMode', viewParam);
      } catch (error) {
        console.error('LocalStorage error:', error);
      }
    } else if (!viewParam) {
      // URLパラメータがない場合はローカルストレージから読み込む
      try {
        const savedViewMode = localStorage.getItem('liveViewMode');
        if (savedViewMode === 'list' || savedViewMode === 'timeline') {
          setViewMode(savedViewMode as ViewMode);
        }
      } catch (error) {
        console.error('LocalStorage error:', error);
      }
    }
    
    // 検索クエリの処理
    const q = searchParams.get('q');
    if (q !== null) {
      setSearchQuery(q);
    } else if (q === null && searchQuery !== '') {
      setSearchQuery('');
    }
    
    // 年フィルターの処理
    const year = searchParams.get('year');
    if (year !== null && !isNaN(Number(year))) {
      setYearFilter(Number(year));
    } else if (year === null && yearFilter !== null) {
      setYearFilter(null);
    }
    
    // 会場フィルターの処理
    const venue = searchParams.get('venue');
    if (venue !== null) {
      setVenueFilter(venue);
    } else if (venue === null && venueFilter !== null) {
      setVenueFilter(null);
    }
    
  }, [searchParams, searchQuery, yearFilter, venueFilter]); // searchParamsと他の状態が変更されたときに実行
  
  // ビューモード変更時にURLとローカルストレージを更新
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      // ローカルストレージに保存
      localStorage.setItem('liveViewMode', mode);
      
      // URLを更新（ブラウザの履歴を保持）
      const url = new URL(window.location.href);
      url.searchParams.set('view', mode);
      
      // 現在のフィルター状態もURLに反映
      if (searchQuery) url.searchParams.set('q', searchQuery);
      else url.searchParams.delete('q');
      
      if (yearFilter) url.searchParams.set('year', yearFilter.toString());
      else url.searchParams.delete('year');
      
      if (venueFilter) url.searchParams.set('venue', venueFilter);
      else url.searchParams.delete('venue');
      
      window.history.pushState({}, '', url.toString());
    } catch (error) {
      console.error('URL or LocalStorage update error:', error);
    }
  };
  
  // URLパラメータを更新する共通関数
  const updateURLParams = (params: {
    view?: ViewMode | null;
    q?: string | null;
    year?: number | null;
    venue?: string | null;
  }) => {
    try {
      const url = new URL(window.location.href);
      
      // 各パラメータを更新または削除
      if (params.view !== undefined) {
        params.view ? url.searchParams.set('view', params.view) : url.searchParams.delete('view');
      }
      
      if (params.q !== undefined) {
        params.q ? url.searchParams.set('q', params.q) : url.searchParams.delete('q');
      }
      
      if (params.year !== undefined) {
        params.year ? url.searchParams.set('year', params.year.toString()) : url.searchParams.delete('year');
      }
      
      if (params.venue !== undefined) {
        params.venue ? url.searchParams.set('venue', params.venue) : url.searchParams.delete('venue');
      }
      
      // 履歴を保持してURLを更新
      window.history.pushState({}, '', url.toString());
    } catch (error) {
      console.error('URL update error:', error);
    }
  };
  
  // フィルタリングされたライブデータ
  const filteredLives = lives.filter(live => {
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
  
  // 利用可能な年と会場のリストを計算
  const availableYears = Array.from(new Set(lives.map(live => 
    new Date(live.date).getFullYear()
  ))).sort((a, b) => b - a); // 新しい年順
  
  const availableVenues = Array.from(new Set(lives.map(live => live.venue))).sort();
  
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
                // URLに検索クエリを反映
                updateURLParams({ q: e.target.value || null });
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
                updateURLParams({ year: newValue });
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
                updateURLParams({ venue: newValue });
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
                
                // URLからフィルターパラメータを削除
                updateURLParams({
                  q: null,
                  year: null,
                  venue: null
                });
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
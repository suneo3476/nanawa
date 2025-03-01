'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { CalendarRange, Settings, ToggleLeft, ToggleRight, List } from 'lucide-react';
import { useSettings } from '@/components/Settings';

export const Header = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { 
    breadcrumbsMode, 
    setBreadcrumbsMode,
    isBreadcrumbsEnabled,
    setIsBreadcrumbsEnabled
  } = useSettings();
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [currentViewMode, setCurrentViewMode] = useState<'list' | 'timeline'>('list');
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  
  // ページロード時と検索パラメータ変更時に現在のビューモードを取得
  useEffect(() => {
    if (pathname === '/lives') {
      const viewParam = searchParams.get('view');
      if (viewParam === 'timeline' || viewParam === 'list') {
        setCurrentViewMode(viewParam as 'list' | 'timeline');
      } else {
        try {
          const savedMode = localStorage.getItem('liveViewMode');
          if (savedMode === 'timeline' || savedMode === 'list') {
            setCurrentViewMode(savedMode as 'list' | 'timeline');
          }
        } catch (error) {
          console.error('LocalStorage error:', error);
        }
      }
    }
  }, [pathname, searchParams]); // URLやクエリパラメータが変わったときに再評価
  
  // タッチデバイスでのドロップダウン表示切替用
  const toggleViewDropdown = (e: React.MouseEvent) => {
    // PCではホバーでメニューが表示されるので、タッチデバイス用に
    if (window.matchMedia('(max-width: 768px)').matches) {
      e.preventDefault();
      setShowViewDropdown(!showViewDropdown);
    }
  };
  
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  const toggleSettingsPanel = () => {
    setShowSettingsPanel(!showSettingsPanel);
    // 設定パネルを開くときは、ビューメニューを閉じる
    if (!showSettingsPanel) {
      setShowViewDropdown(false);
    }
  };

  const toggleBreadcrumbs = () => {
    setIsBreadcrumbsEnabled(!isBreadcrumbsEnabled);
  };

  return (
    <header className="bg-gradient-to-r from-purple-500 to-orange-400 text-white relative" role="banner">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          <Link href="/" className="hover:opacity-90 transition-opacity">七輪</Link>
        </h1>
        <div className="flex items-center gap-2">
          <nav aria-label="メインナビゲーション">
            <ul className="flex flex-wrap space-x-2 items-center">
              <li className="relative group">
                <Link 
                  href={`/lives${currentViewMode === 'timeline' ? '?view=timeline' : ''}`}
                  className={`px-3 py-1 rounded-full text-sm transition-colors inline-flex items-center gap-1 ${
                    isActive('/lives') 
                      ? 'bg-white/30 text-white' 
                      : 'hover:bg-white/20 text-white'
                  }`}
                >
                  <span>ライブ</span>
                </Link>
                
                {/* ビュー切替サブメニュー */}
                <div className="absolute left-0 mt-1 py-1 bg-white rounded-lg shadow-lg whitespace-nowrap z-10 hidden group-hover:block">
                  <Link
                    href="/lives?view=list"
                    className={`block px-4 py-2 text-sm ${
                      currentViewMode === 'list' ? 'text-purple-600 font-medium bg-purple-50' : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
                    }`}
                  >
                    <List size={14} className="inline mr-2" />
                    リスト表示
                  </Link>
                  <Link
                    href="/lives?view=timeline"
                    className={`block px-4 py-2 text-sm ${
                      currentViewMode === 'timeline' ? 'text-purple-600 font-medium bg-purple-50' : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
                    }`}
                  >
                    <CalendarRange size={14} className="inline mr-2" />
                    タイムライン表示
                  </Link>
                </div>
              </li>
              <li>
                <Link 
                  href="/songs" 
                  className={`px-3 py-1 rounded-full text-sm transition-colors inline-block ${
                    isActive('/songs') 
                      ? 'bg-white/30 text-white' 
                      : 'hover:bg-white/20 text-white'
                  }`}
                >
                  楽曲一覧
                </Link>
              </li>
              <li>
                <Link 
                  href="/search" 
                  className={`px-3 py-1 rounded-full text-sm transition-colors inline-block ${
                    isActive('/search') 
                      ? 'bg-white/30 text-white' 
                      : 'hover:bg-white/20 text-white'
                  }`}
                >
                  詳細検索
                </Link>
              </li>
              <li>
                <Link 
                  href="/stats" 
                  className={`px-3 py-1 rounded-full text-sm transition-colors inline-block ${
                    isActive('/stats') 
                      ? 'bg-white/30 text-white' 
                      : 'hover:bg-white/20 text-white'
                  }`}
                >
                  演奏統計
                </Link>
              </li>
              <li>
                <Link 
                  href="/heatmap" 
                  className={`px-3 py-1 rounded-full text-sm transition-colors inline-block ${
                    isActive('/heatmap') 
                      ? 'bg-white/30 text-white' 
                      : 'hover:bg-white/20 text-white'
                  }`}
                >
                  ヒートマップ
                </Link>
              </li>
            </ul>
          </nav>
          
          {/* 設定ボタン */}
          <button
            className="ml-2 p-2 rounded-full hover:bg-white/20 transition-colors"
            onClick={toggleSettingsPanel}
            aria-label="設定"
            aria-expanded={showSettingsPanel}
            aria-controls="settings-panel"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
      
      {/* 設定パネル */}
      {showSettingsPanel && (
        <div 
          id="settings-panel"
          className="absolute right-4 top-16 bg-white text-gray-800 shadow-lg rounded-lg p-4 w-64 z-50"
        >
          <h2 className="text-sm font-semibold mb-2 text-gray-600">表示設定</h2>
          
          <div className="space-y-3">
            {/* パンくずリスト有効/無効 */}
            <div className="flex items-center justify-between">
              <label htmlFor="breadcrumbs-toggle" className="text-sm cursor-pointer">
                パンくずリスト表示
              </label>
              <button
                onClick={toggleBreadcrumbs}
                aria-pressed={isBreadcrumbsEnabled}
                className="text-purple-600 hover:text-purple-800 focus:outline-none"
                title={isBreadcrumbsEnabled ? "パンくずリストを非表示" : "パンくずリストを表示"}
              >
                {isBreadcrumbsEnabled ? 
                  <ToggleRight size={24} /> : 
                  <ToggleLeft size={24} />
                }
              </button>
            </div>
            
            {/* パンくずリストモード選択 */}
            {isBreadcrumbsEnabled && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">パンくずリストのモード</p>
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-1 text-xs rounded-full ${
                      breadcrumbsMode === 'history'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setBreadcrumbsMode('history')}
                  >
                    履歴型
                  </button>
                  <button
                    className={`px-3 py-1 text-xs rounded-full ${
                      breadcrumbsMode === 'location'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => setBreadcrumbsMode('location')}
                  >
                    階層型
                  </button>
                </div>
                
                <div className="mt-4 text-xs text-gray-500 p-2 bg-gray-50 rounded">
                  <p className="mb-1 font-medium">設定ガイド:</p>
                  <p><strong>履歴型:</strong> 閲覧したページ順に表示</p>
                  <p><strong>階層型:</strong> サイト構造に基づいて表示</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
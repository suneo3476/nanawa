'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarRange, Settings } from 'lucide-react';
import { useSettings } from '@/components/Settings';

export const Header = () => {
  const pathname = usePathname();
  const { 
    breadcrumbsMode, 
    setBreadcrumbsMode,
    isBreadcrumbsEnabled,
    setIsBreadcrumbsEnabled
  } = useSettings();
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  const toggleSettingsPanel = () => {
    setShowSettingsPanel(!showSettingsPanel);
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
              <li>
                <Link 
                  href="/lives" 
                  className={`px-3 py-1 rounded-full text-sm transition-colors inline-block ${
                    isActive('/lives') 
                      ? 'bg-white/30 text-white' 
                      : 'hover:bg-white/20 text-white'
                  }`}
                >
                  ライブ一覧
                </Link>
              </li>
              <li>
                <Link 
                  href="/timeline" 
                  className={`px-3 py-1 rounded-full text-sm transition-colors inline-flex items-center gap-1 ${
                    isActive('/timeline') 
                      ? 'bg-white/30 text-white' 
                      : 'hover:bg-white/20 text-white'
                  }`}
                >
                  <CalendarRange size={14} />
                  <span>タイムライン</span>
                </Link>
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
              <label htmlFor="breadcrumbs-toggle" className="text-sm">
                パンくずリスト
              </label>
              <div className="relative inline-block w-10 h-5 rounded-full cursor-pointer">
                <input
                  type="checkbox"
                  id="breadcrumbs-toggle"
                  className="sr-only"
                  checked={isBreadcrumbsEnabled}
                  onChange={() => setIsBreadcrumbsEnabled(!isBreadcrumbsEnabled)}
                />
                <span 
                  className={`absolute inset-0 rounded-full transition-colors ${
                    isBreadcrumbsEnabled ? 'bg-purple-500' : 'bg-gray-300'
                  }`}
                />
                <span 
                  className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform transform ${
                    isBreadcrumbsEnabled ? 'translate-x-5' : ''
                  }`}
                />
              </div>
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
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
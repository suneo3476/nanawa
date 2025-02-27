'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarRange } from 'lucide-react';

export const Header = () => {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`);
  };

  return (
    <header className="bg-gradient-to-r from-purple-500 to-orange-400 text-white" role="banner">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          <Link href="/" className="hover:opacity-90 transition-opacity">七輪</Link>
        </h1>
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
      </div>
    </header>
  );
};
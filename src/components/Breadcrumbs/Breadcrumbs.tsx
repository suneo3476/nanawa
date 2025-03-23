// src/components/Breadcrumbs/Breadcrumbs.tsx

'use client';

import React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { useBreadcrumbs } from './hooks/useBreadcrumbs';
import { BreadcrumbItem } from './BreadcrumbItem';

/**
 * パンくずリストのメインコンポーネント
 */
export const Breadcrumbs = () => {
  const { 
    history, 
    isLoading, 
    breadcrumbsMode, 
    isBreadcrumbsEnabled 
  } = useBreadcrumbs();

  // パンくずリストが無効の場合は何も表示しない
  if (!isBreadcrumbsEnabled) {
    return null;
  }
  
  // historyモードで表示すべき履歴がない場合は何も表示しない
  if (breadcrumbsMode === 'history' && history.length <= 1) {
    return null;
  }
  
  // ロード中の場合は簡易表示
  if (isLoading && history.length === 0) {
    return (
      <nav aria-label="パンくずリスト" className="px-4 py-2 bg-white rounded-lg shadow-sm mb-4">
        <div className="flex items-center h-5">
          <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="パンくずリスト" className="px-4 py-2 bg-white rounded-lg shadow-sm mb-4">
      <ol className="flex flex-wrap items-center space-x-2 text-sm">
        {/* ホームアイコンは常に表示（historyモードの場合のみ） */}
        {breadcrumbsMode === 'history' && (
          <li className="flex items-center">
            <Link 
              href="/" 
              className="text-purple-600 hover:text-purple-800 flex items-center"
              aria-label="ホームに戻る"
            >
              <Home size={16} />
            </Link>
          </li>
        )}
        
        {/* パンくずリストのアイテムを表示 */}
        {history.map((item, index) => (
          <BreadcrumbItem
            key={`${item.path}-${item.timestamp}`}
            item={item}
            isLast={index === history.length - 1}
            showDivider={index > 0 || breadcrumbsMode === 'history'}
          />
        ))}
      </ol>
    </nav>
  );
};
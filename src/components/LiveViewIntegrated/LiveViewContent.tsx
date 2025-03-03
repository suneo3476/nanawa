'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { LiveListClient } from '../LiveList/LiveListClient';
import LiveTimeline from '../LiveTimeline';
import ViewToggle from './ViewToggle';
import type { Live } from '@/types/live';

interface LiveViewContentProps {
  lives: Live[];
}

/**
 * ライブビューの実装コンポーネント
 * useSearchParamsを使用してクエリパラメータを処理
 */
export default function LiveViewContent({ lives }: LiveViewContentProps) {
  // クエリパラメータからビューモードを取得
  const searchParams = useSearchParams();
  const viewFromUrl = searchParams.get('view');
  
  // ローカルストレージからデフォルトビューモードを取得（URLで指定がない場合）
  const [defaultView, setDefaultView] = useLocalStorage('liveViewMode', 'timeline');
  
  // 最終的なビューモード（URLとローカルストレージの組み合わせ）
  const [viewMode, setViewMode] = useState(viewFromUrl || defaultView);
  
  // URLパラメータが変更されたら、ビューモードを更新
  useEffect(() => {
    const newView = viewFromUrl || defaultView;
    setViewMode(newView);
    
    // URLで指定されている場合は、ローカルストレージのデフォルトも更新
    if (viewFromUrl) {
      setDefaultView(viewFromUrl);
    }
  }, [viewFromUrl, defaultView, setDefaultView]);
  
  return (
    <div className="live-view">
      {/* ビュー切替ボタン */}
      <ViewToggle currentView={viewMode} />
      
      {/* 選択されたビューモードに応じたコンポーネントを表示 */}
      <div className="mt-4">
        {viewMode === 'list' ? (
          <LiveListClient lives={lives} />
        ) : (
          <LiveTimeline lives={lives} />
        )}
      </div>
    </div>
  );
}
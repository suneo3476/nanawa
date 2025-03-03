// components/Breadcrumbs/BreadcrumbsContent.tsx
'use client';

import { useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Home, ChevronRight, Calendar, Music, Info, Search, LineChart } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

// パスのセグメントとラベルのマッピング
const PATH_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  '': { label: 'ホーム', icon: <Home size={14} /> },
  'lives': { label: 'ライブ', icon: <Calendar size={14} /> },
  'songs': { label: '楽曲', icon: <Music size={14} /> },
  'search': { label: '検索', icon: <Search size={14} /> },
  'stats': { label: '統計', icon: <LineChart size={14} /> },
  'about': { label: '七輪について', icon: <Info size={14} /> },
};

// ライブIDからラベルを取得するための型（実際の実装では適宜修正）
interface LiveData {
  liveId: string;
  name: string;
  date: string;
}

// 楽曲IDからラベルを取得するための型（実際の実装では適宜修正）
interface SongData {
  songId: string;
  title: string;
}

/**
 * パンくずリストの実装コンポーネント
 * useSearchParamsとusePathnameを使用してパスとクエリパラメータを処理
 */
export default function BreadcrumbsContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // パスの分割
  const pathSegments = pathname.split('/').filter(Boolean);
  
  // ブレッドクラムアイテムの状態
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{
    label: string;
    path: string;
    icon?: React.ReactNode;
  }>>([]);
  
  // パンくずの表示モード (location = 階層型, history = 履歴型)
  const [breadcrumbMode, setBreadcrumbMode] = useLocalStorage('breadcrumbMode', 'location');
  
  // 履歴型パンくず用の履歴
  const [historyLabels, setHistoryLabels] = useLocalStorage('breadcrumbHistory', [] as Array<{
    label: string;
    path: string;
    icon?: React.ReactNode;
  }>);
  
  // LiveIDからライブ名を取得する関数（実際の実装では適宜修正）
  const getLiveLabel = useCallback((liveId: string): string => {
    // 本来はAPIやコンテキストからデータを取得
    // 仮の実装としてIDを返す
    return `ライブ #${liveId.split('_')[1]}`;
  }, []);
  
  // SongIDから曲名を取得する関数（実際の実装では適宜修正）
  const getSongLabel = useCallback((songId: string): string => {
    // 本来はAPIやコンテキストからデータを取得
    // 仮の実装としてIDを返す
    return `曲 #${songId.split('_')[1]}`;
  }, []);
  
  // ブレッドクラムのビルド（階層型）
  const buildLocationBreadcrumbs = useCallback(() => {
    // 常にホームから始める
    const crumbs = [
      { 
        label: PATH_LABELS[''].label, 
        path: '/',
        icon: PATH_LABELS[''].icon
      }
    ];
    
    // パスセグメントごとにブレッドクラムを追加
    let currentPath = '';
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      let label = segment;
      let icon;
      
      // セグメント名からラベルを取得
      if (PATH_LABELS[segment]) {
        label = PATH_LABELS[segment].label;
        icon = PATH_LABELS[segment].icon;
      } 
      // LiveIDのパターン
      else if (segment.startsWith('live_')) {
        label = getLiveLabel(segment);
        icon = <Calendar size={14} />;
      } 
      // SongIDのパターン
      else if (segment.startsWith('song_')) {
        label = getSongLabel(segment);
        icon = <Music size={14} />;
      }
      
      crumbs.push({
        label,
        path: currentPath,
        icon
      });
    });
    
    return crumbs;
  }, [pathSegments, getLiveLabel, getSongLabel]);
  
  // 履歴型パンくずリストの更新
  const updateHistoryBreadcrumbs = useCallback(() => {
    // 現在のパスのラベル情報を取得
    const currentLabel = pathSegments.length === 0 
      ? PATH_LABELS[''].label
      : pathSegments.length === 1 && PATH_LABELS[pathSegments[0]]
        ? PATH_LABELS[pathSegments[0]].label
        : pathSegments.length === 2 && pathSegments[0] === 'lives' && pathSegments[1].startsWith('live_')
          ? getLiveLabel(pathSegments[1])
          : pathSegments.length === 2 && pathSegments[0] === 'songs' && pathSegments[1].startsWith('song_')
            ? getSongLabel(pathSegments[1])
            : pathname; // フォールバック
            
    // 現在のパスのアイコン情報を取得
    const currentIcon = pathSegments.length === 0 
      ? PATH_LABELS[''].icon
      : pathSegments.length === 1 && PATH_LABELS[pathSegments[0]]
        ? PATH_LABELS[pathSegments[0]].icon
        : pathSegments.length === 2 && pathSegments[0] === 'lives'
          ? <Calendar size={14} />
          : pathSegments.length === 2 && pathSegments[0] === 'songs'
            ? <Music size={14} />
            : undefined;
    
    // 新しい履歴アイテム
    const newHistoryItem = {
      label: currentLabel,
      path: pathname,
      icon: currentIcon
    };
    
    // 既に同じパスが履歴にある場合は削除
    const filteredHistory = historyLabels.filter(item => item.path !== pathname);
    
    // 履歴の先頭にホームを追加（常に表示）
    const newHistory = [
      { label: PATH_LABELS[''].label, path: '/', icon: PATH_LABELS[''].icon },
      ...filteredHistory,
      newHistoryItem
    ].slice(-5); // 最大5アイテムまで
    
    // 重複を削除
    const uniqueHistory = [];
    const paths = new Set();
    
    for (const item of newHistory) {
      if (!paths.has(item.path)) {
        paths.add(item.path);
        uniqueHistory.push(item);
      }
    }
    
    // 履歴型パンくずリストを更新
    setHistoryLabels(uniqueHistory);
    
    return uniqueHistory;
  }, [pathname, pathSegments, getLiveLabel, getSongLabel, historyLabels, setHistoryLabels]);
  
  // パンくずリストの構築
  useEffect(() => {
    if (breadcrumbMode === 'location') {
      // 階層型パンくずリスト
      setBreadcrumbs(buildLocationBreadcrumbs());
    } else {
      // 履歴型パンくずリスト
      setBreadcrumbs(updateHistoryBreadcrumbs());
    }
  }, [pathname, breadcrumbMode, buildLocationBreadcrumbs, updateHistoryBreadcrumbs]);
  
  // パンくずモードの切り替え
  const toggleBreadcrumbMode = () => {
    setBreadcrumbMode(breadcrumbMode === 'location' ? 'history' : 'location');
  };
  
  return (
    <nav className="breadcrumbs py-2 px-4 bg-gray-100 rounded-md mb-4 flex justify-between items-center">
      <ol className="flex flex-wrap items-center text-sm text-gray-600">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          
          return (
            <li key={crumb.path} className="flex items-center">
              {index > 0 && (
                <ChevronRight size={14} className="mx-2 text-gray-400" />
              )}
              
              {isLast ? (
                <span className="font-medium text-gray-800 flex items-center gap-1">
                  {crumb.icon && <span className="text-gray-500">{crumb.icon}</span>}
                  {crumb.label}
                </span>
              ) : (
                <Link 
                  href={crumb.path} 
                  className="hover:text-purple-600 transition-colors flex items-center gap-1"
                >
                  {crumb.icon && <span className="text-gray-500">{crumb.icon}</span>}
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      
      <button 
        onClick={toggleBreadcrumbMode}
        className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        title={breadcrumbMode === 'location' ? '履歴型に切り替え' : '階層型に切り替え'}
      >
        {breadcrumbMode === 'location' ? '履歴型' : '階層型'}
      </button>
    </nav>
  );
}
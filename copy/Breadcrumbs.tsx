'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { useSettings } from '@/components/Settings';

// パンくずリストの履歴アイテムの型定義
type BreadcrumbItem = {
  path: string;
  label: string;
  timestamp: number;
  type?: 'home' | 'live' | 'song' | 'other';
};

// 特定のパスに対する表示ラベルのマッピング
const pathLabels: Record<string, string> = {
  '/': 'ホーム',
  '/lives': 'ライブ一覧',
  '/songs': '楽曲一覧',
  '/search': '詳細検索',
  '/stats': '演奏統計',
  '/heatmap': 'ヒートマップ',
  '/timeline': 'タイムライン',
};

// ライブデータと楽曲データのキャッシュ
const liveCache = new Map<string, { name: string; venue: string }>();
const songCache = new Map<string, { title: string }>();

export const Breadcrumbs = () => {
  const pathname = usePathname();
  const [history, setHistory] = useState<BreadcrumbItem[]>([]);
  const { breadcrumbsMode, isBreadcrumbsEnabled } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  
  // 履歴を最大10アイテムまでに制限（長いナビゲーション履歴に対応）
  const MAX_HISTORY_ITEMS = 10;

  // パスからライブIDまたは曲IDを抽出する関数
  const extractIdAndType = useCallback((path: string): { type: 'live' | 'song' | 'other'; id: string | null } => {
    if (path.startsWith('/lives/')) {
      return { type: 'live', id: path.split('/').pop() || null };
    }
    if (path.startsWith('/songs/')) {
      return { type: 'song', id: path.split('/').pop() || null };
    }
    return { type: 'other', id: null };
  }, []);

  // IDに基づいてライブ名や曲名を取得する関数
  const fetchEntityName = useCallback(async (type: 'live' | 'song', id: string): Promise<string> => {
    // キャッシュをチェック
    if (type === 'live' && liveCache.has(id)) {
      const data = liveCache.get(id)!;
      return `${data.name}@${data.venue}`;
    }
    if (type === 'song' && songCache.has(id)) {
      return songCache.get(id)!.title;
    }

    try {
      let response;
      if (type === 'live') {
        response = await fetch(`/api/lives/${id}`);
      } else {
        response = await fetch(`/api/songs/${id}`);
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} data`);
      }

      const data = await response.json();
      
      if (type === 'live') {
        const liveName = `${data.name}@${data.venue}`;
        liveCache.set(id, { name: data.name, venue: data.venue });
        return liveName;
      } else {
        songCache.set(id, { title: data.title });
        return data.title;
      }
    } catch (error) {
      console.error(`Error fetching ${type} data:`, error);
      return type === 'live' ? 'ライブ詳細' : '楽曲詳細';
    }
  }, []);

  // パスからラベルと種類を取得する関数
  const getPathLabelAndType = useCallback(async (path: string): Promise<{ label: string; type: 'home' | 'live' | 'song' | 'other' }> => {
    // ホームページの場合
    if (path === '/') {
      return { label: 'ホーム', type: 'home' };
    }
    
    // 特定のパスに対応するラベルがある場合はそれを返す
    if (pathLabels[path]) {
      return { label: pathLabels[path], type: 'other' };
    }

    // ライブ詳細ページまたは楽曲詳細ページの場合
    const { type, id } = extractIdAndType(path);
    if ((type === 'live' || type === 'song') && id) {
      try {
        const name = await fetchEntityName(type, id);
        return { label: name, type };
      } catch (error) {
        console.error('Error getting entity name:', error);
        return { 
          label: type === 'live' ? 'ライブ詳細' : '楽曲詳細', 
          type 
        };
      }
    }

    // 上記以外のパスの場合はパス名から自動生成
    return {
      label: path
        .split('/')
        .pop()!
        .replace(/-/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase()),
      type: 'other'
    };
  }, [extractIdAndType, fetchEntityName]);

  // パスを分割して階層構造を生成する関数（locationモード用）
  const getLocationBreadcrumbs = useCallback(async (path: string): Promise<BreadcrumbItem[]> => {
    const segments = path.split('/').filter(Boolean);
    
    // ホームページは常に含める
    const breadcrumbs: BreadcrumbItem[] = [
      { path: '/', label: 'ホーム', timestamp: Date.now(), type: 'home' }
    ];
    
    // 各セグメントに対して階層を構築
    let currentPath = '';
    for (const segment of segments) {
      currentPath += `/${segment}`;
      const { label, type } = await getPathLabelAndType(currentPath);
      breadcrumbs.push({
        path: currentPath,
        label,
        timestamp: Date.now(),
        type
      });
    }
    
    return breadcrumbs;
  }, [getPathLabelAndType]);

  // 現在のパスに対する具体的なラベルと種類を取得
  const updateCurrentPageLabel = useCallback(async (item: BreadcrumbItem): Promise<BreadcrumbItem> => {
    // 既に種類が設定されている場合はそのまま
    if (item.type) {
      return item;
    }
    
    // 基本的なパスの種類を特定
    const { type, id } = extractIdAndType(item.path);
    
    // 具体的な名前を取得
    if ((type === 'live' || type === 'song') && id) {
      try {
        const name = await fetchEntityName(type, id);
        return { ...item, label: name, type };
      } catch (error) {
        console.error('Error updating label:', error);
      }
    }
    
    return { ...item, type: type || 'other' };
  }, [extractIdAndType, fetchEntityName]);

  // 履歴内のラベルを更新する関数
  const updateHistoryLabels = useCallback(async (historyItems: BreadcrumbItem[]): Promise<BreadcrumbItem[]> => {
    const updatedItems = [...historyItems];
    
    for (let i = 0; i < updatedItems.length; i++) {
      updatedItems[i] = await updateCurrentPageLabel(updatedItems[i]);
    }
    
    return updatedItems;
  }, [updateCurrentPageLabel]);

  useEffect(() => {
    // パンくずリストが無効の場合は何もしない
    if (!isBreadcrumbsEnabled) return;
    
    const updateBreadcrumbs = async () => {
      setIsLoading(true);
      
      try {
        // locationモードの場合は階層構造を生成
        if (breadcrumbsMode === 'location') {
          const locationCrumbs = await getLocationBreadcrumbs(pathname);
          setHistory(locationCrumbs);
          setIsLoading(false);
          return;
        }
        
        // historyモードの場合の処理
        const { label, type } = await getPathLabelAndType(pathname);
        
        // 現在のページ情報を生成
        const currentPage: BreadcrumbItem = {
          path: pathname,
          label,
          timestamp: Date.now(),
          type
        };

        setHistory(prevHistory => {
          // 現在のページが既に履歴にある場合は、そこまでの履歴を残す
          const existingIndex = prevHistory.findIndex((item) => item.path === pathname);
          
          let newHistory;
          if (existingIndex >= 0) {
            // 既存の履歴を使用し、アイテムを更新
            newHistory = prevHistory.slice(0, existingIndex + 1);
            newHistory[existingIndex] = currentPage;
          } else {
            // 新しいアイテムを追加
            newHistory = [...prevHistory, currentPage];
            
            // 最大数を超える場合は古いものを削除
            if (newHistory.length > MAX_HISTORY_ITEMS) {
              newHistory = newHistory.slice(newHistory.length - MAX_HISTORY_ITEMS);
            }
          }
          
          return newHistory;
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error updating breadcrumbs:', error);
        setIsLoading(false);
      }
    };
    
    updateBreadcrumbs();
  }, [
    pathname, 
    breadcrumbsMode, 
    isBreadcrumbsEnabled, 
    getPathLabelAndType, 
    getLocationBreadcrumbs
  ]);

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

  // ラベルに絵文字を追加する関数
  const getDisplayLabel = (item: BreadcrumbItem) => {
    if (item.type === 'home') {
      return item.label;
    } else if (item.type === 'live') {
      return `🎤 ${item.label}`;
    } else if (item.type === 'song') {
      return `🎵 ${item.label}`;
    } else {
      return item.label;
    }
  };

  return (
    <nav aria-label="パンくずリスト" className="px-4 py-2 bg-white rounded-lg shadow-sm mb-4">
      <ol className="flex flex-wrap items-center space-x-2 text-sm">
        {/* ホームアイコンは常に表示（locationモードの場合はスキップ） */}
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
        
        {history.map((item, index) => (
          <React.Fragment key={`${item.path}-${item.timestamp}`}>
            {/* 最初の要素以外はChevronを表示 */}
            {index > 0 || breadcrumbsMode === 'history' ? (
              <li className="flex items-center text-gray-400">
                <ChevronRight size={14} />
              </li>
            ) : null}
            
            <li>
              {index === history.length - 1 ? (
                // 現在のページ（最後の要素）
                <span className="font-medium text-gray-800" aria-current="page">
                  {getDisplayLabel(item)}
                </span>
              ) : (
                // 過去のページ
                <Link
                  href={item.path}
                  className="text-purple-600 hover:text-purple-800 hover:underline"
                >
                  {getDisplayLabel(item)}
                </Link>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
};
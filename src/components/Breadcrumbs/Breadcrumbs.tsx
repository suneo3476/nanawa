// src/components/Breadcrumbs/Breadcrumbs.tsx

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
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
  '/search': 'ライブとセトリ',
  '/stats': 'アクティビティ',
  '/heatmap': 'ヒートマップ',
};

// ライブデータと楽曲データのキャッシュ
const liveCache = new Map<string, { name: string; venue: string }>();
const songCache = new Map<string, { title: string }>();

export const Breadcrumbs = () => {
  const [history, setHistory] = useState<BreadcrumbItem[]>([]);
  const { breadcrumbsMode, isBreadcrumbsEnabled } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  
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

  // IDに基づいてライブ名や曲名を取得する関数（SSG対応のため簡略化）
  const fetchEntityName = useCallback(async (type: 'live' | 'song', id: string): Promise<string> => {
    // キャッシュをチェック
    if (type === 'live' && liveCache.has(id)) {
      const data = liveCache.get(id)!;
      return `${data.name}@${data.venue}`;
    }
    if (type === 'song' && songCache.has(id)) {
      return songCache.get(id)!.title;
    }

    // SSGではAPI呼び出しを行わないので、汎用的なラベルを返す
    return type === 'live' ? 'ライブ詳細' : '楽曲詳細';
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

  // ページのロード時とルート変更時に履歴を更新
  useEffect(() => {
    // サーバーサイドレンダリング時は何もしない
    if (typeof window === 'undefined') return;
    
    // パンくずリストが無効の場合は何もしない
    if (!isBreadcrumbsEnabled) return;
    
    const updateBreadcrumbs = async () => {
      setIsLoading(true);
      
      try {
        // 現在のパスを取得
        const path = window.location.pathname;
        setCurrentPath(path);
        
        // locationモードの場合は階層構造を生成
        if (breadcrumbsMode === 'location') {
          const locationCrumbs = await getLocationBreadcrumbs(path);
          setHistory(locationCrumbs);
          
          // localStorageに保存
          try {
            localStorage.setItem('breadcrumbsHistory', JSON.stringify(locationCrumbs));
          } catch (error) {
            console.error('Error saving breadcrumbs to localStorage:', error);
          }
          
          setIsLoading(false);
          return;
        }
        
        // historyモードの場合の処理
        const fullPath = path;
        
        const { label, type } = await getPathLabelAndType(path);
        
        // 現在のページ情報を生成
        const currentPage: BreadcrumbItem = {
          path: fullPath,
          label,
          timestamp: Date.now(),
          type
        };

        setHistory(prevHistory => {
          // 現在のページが既に履歴にある場合は、そこまでの履歴を残す
          const existingIndex = prevHistory.findIndex((item) => 
            item.path === fullPath); // クエリパラメータをサポートしないためシンプルに比較
          
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
          
          // localStorageに保存
          try {
            localStorage.setItem('breadcrumbsHistory', JSON.stringify(newHistory));
          } catch (error) {
            console.error('Error saving breadcrumbs to localStorage:', error);
          }
          
          return newHistory;
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error updating breadcrumbs:', error);
        setIsLoading(false);
      }
    };
    
    // 初期ロード時に履歴を取得
    const loadSavedHistory = () => {
      try {
        const savedHistory = localStorage.getItem('breadcrumbsHistory');
        if (savedHistory) {
          setHistory(JSON.parse(savedHistory));
        }
      } catch (error) {
        console.error('Error loading saved breadcrumbs:', error);
      }
    };
    
    loadSavedHistory();
    updateBreadcrumbs();
    
    // ルート変更のイベントリスナーを設定
    const handleRouteChange = () => {
      updateBreadcrumbs();
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [
    breadcrumbsMode,
    isBreadcrumbsEnabled,
    getPathLabelAndType,
    getLocationBreadcrumbs,
    updateHistoryLabels
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
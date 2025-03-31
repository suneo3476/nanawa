// src/components/Breadcrumbs/hooks/useBreadcrumbs.tsx

import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/components/Settings';
import { BreadcrumbItem } from '../types/BreadcrumbsTypes';
import { 
  pathLabels, 
  extractIdAndType, 
  loadBreadcrumbsHistory,
  saveBreadcrumbsHistory
} from '../utils/BreadcrumbsUtils';

// 履歴の最大アイテム数
const MAX_HISTORY_ITEMS = 10;

/**
 * パンくずリストのロジックを管理するカスタムフック
 */
export function useBreadcrumbs() {
  const [history, setHistory] = useState<BreadcrumbItem[]>([]);
  const { breadcrumbsMode, isBreadcrumbsEnabled } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState('');

  /**
   * IDに基づいてライブ名や曲名を取得する関数
   */
  const fetchEntityName = useCallback(async (type: 'live' | 'song', id: string): Promise<string> => {
    // SSG対応のため簡略化 - 実際のアプリではAPI呼び出しを行う
    return type === 'live' ? 'ライブ詳細' : '楽曲詳細';
  }, []);

  /**
   * パスからラベルと種類を取得する関数
   */
  const getPathLabelAndType = useCallback(async (path: string): Promise<{ 
    label: string; 
    type: 'home' | 'live' | 'song' | 'other' 
  }> => {
    // ホームページの場合
    if (path === '/') {
      return { label: 'ホーム', type: 'home' };
    }
    
    // 特定のパスに対応するラベルがある場合
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

    // その他のパスの場合はパス名から自動生成
    return {
      label: path
        .split('/')
        .pop()!
        .replace(/-/g, ' ')
        .replace(/^\w/, (c) => c.toUpperCase()),
      type: 'other'
    };
  }, [fetchEntityName]);

  /**
   * パスを分割して階層構造を生成する関数（locationモード用）
   */
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

  /**
   * パンくずリストを更新する関数
   */
  const updateBreadcrumbs = useCallback(async () => {
    if (typeof window === 'undefined') return;
    
    setIsLoading(true);
    
    try {
      // 現在のパスを取得
      const path = window.location.pathname;
      setCurrentPath(path);
      
      // locationモードの場合は階層構造を生成
      if (breadcrumbsMode === 'location') {
        const locationCrumbs = await getLocationBreadcrumbs(path);
        setHistory(locationCrumbs);
        saveBreadcrumbsHistory(locationCrumbs);
        setIsLoading(false);
        return;
      }
      
      // historyモードの場合の処理
      const { label, type } = await getPathLabelAndType(path);
      
      // 現在のページ情報を生成
      const currentPage: BreadcrumbItem = {
        path,
        label,
        timestamp: Date.now(),
        type
      };

      setHistory(prevHistory => {
        // 現在のページが既に履歴にある場合は、そこまでの履歴を残す
        const existingIndex = prevHistory.findIndex(item => item.path === path);
        
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
        
        saveBreadcrumbsHistory(newHistory);
        return newHistory;
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error updating breadcrumbs:', error);
      setIsLoading(false);
    }
  }, [breadcrumbsMode, getLocationBreadcrumbs, getPathLabelAndType]);

  /**
   * 初期ロード時と経路変更時に実行
   */
  useEffect(() => {
    if (typeof window === 'undefined' || !isBreadcrumbsEnabled) return;
    
    // 初期ロード時に履歴を取得
    const loadSavedHistory = () => {
      const savedHistory = loadBreadcrumbsHistory();
      if (savedHistory.length > 0) {
        setHistory(savedHistory);
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
  }, [isBreadcrumbsEnabled, updateBreadcrumbs]);

  return { 
    history, 
    isLoading, 
    currentPath, 
    breadcrumbsMode, 
    isBreadcrumbsEnabled 
  };
}
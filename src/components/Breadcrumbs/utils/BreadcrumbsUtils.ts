// src/components/Breadcrumbs/utils/BreadcrumbsUtils.ts

import { BreadcrumbItem } from '../types/BreadcrumbsTypes';

/**
 * 特定のパスに対する表示ラベルのマッピング
 */
export const pathLabels: Record<string, string> = {
  '/': 'ホーム',
  '/search': 'ライブとセトリ',
  '/stats': 'アクティビティ',
  '/heatmap': 'ヒートマップ',
};

// ライブデータと楽曲データのキャッシュ
export const liveCache = new Map<string, { name: string; venue: string }>();
export const songCache = new Map<string, { title: string }>();

/**
 * パスからライブIDまたは曲IDを抽出する関数
 */
export function extractIdAndType(path: string): { type: 'live' | 'song' | 'other'; id: string | null } {
  if (path.startsWith('/lives/')) {
    return { type: 'live', id: path.split('/').pop() || null };
  }
  if (path.startsWith('/songs/')) {
    return { type: 'song', id: path.split('/').pop() || null };
  }
  return { type: 'other', id: null };
}

/**
 * ブレッドクラムアイテムのラベルに適切なアイコンを付与
 */
export function formatDisplayLabel(item: BreadcrumbItem): string {
  if (item.type === 'home') {
    return item.label;
  } else if (item.type === 'live') {
    return `🎤 ${item.label}`;
  } else if (item.type === 'song') {
    return `🎵 ${item.label}`;
  } else {
    return item.label;
  }
}

/**
 * LocalStorageからパンくずリスト履歴を読み込む
 */
export function loadBreadcrumbsHistory(): BreadcrumbItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const savedHistory = localStorage.getItem('breadcrumbsHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  } catch (error) {
    console.error('Error loading saved breadcrumbs:', error);
    return [];
  }
}

/**
 * LocalStorageにパンくずリスト履歴を保存
 */
export function saveBreadcrumbsHistory(history: BreadcrumbItem[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('breadcrumbsHistory', JSON.stringify(history));
  } catch (error) {
    console.error('Error saving breadcrumbs to localStorage:', error);
  }
}
// src/components/Breadcrumbs/types/BreadcrumbsTypes.ts

/**
 * パンくずリストの履歴アイテムの型定義
 */
export type BreadcrumbItem = {
  path: string;        // パスURL
  label: string;       // 表示ラベル
  timestamp: number;   // 追加時のタイムスタンプ
  type?: 'home' | 'live' | 'song' | 'other';  // アイテムタイプ
};

/**
 * パンくずリストの表示モード
 */
export type BreadcrumbsMode = 'history' | 'location';
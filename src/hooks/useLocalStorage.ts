// hooks/useLocalStorage.ts
'use client';

import { useState, useEffect } from 'react';

/**
 * ローカルストレージを使用した状態管理フック
 * クライアントサイドでのみ実行されるように安全に実装
 * 
 * @param key ローカルストレージのキー
 * @param initialValue 初期値
 * @returns [値, 値を設定する関数] の配列
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // 初期値の状態を設定
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  
  // マウント時にローカルストレージから値を読み込み
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error('ローカルストレージからの読み込みエラー:', error);
    }
  }, [key]);
  
  // 値を設定する関数
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // 関数の場合は前の値を渡して実行
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // 状態を更新
      setStoredValue(valueToStore);
      
      // ローカルストレージに保存
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error('ローカルストレージへの保存エラー:', error);
    }
  };
  
  return [storedValue, setValue] as const;
}
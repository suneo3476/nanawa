// src/components/Settings/SettingsContext.tsx

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type SettingsContextType = {
  breadcrumbsMode: 'history' | 'location';
  setBreadcrumbsMode: (mode: 'history' | 'location') => void;
  isBreadcrumbsEnabled: boolean;
  setIsBreadcrumbsEnabled: (enabled: boolean) => void;
};

// デフォルト値でコンテキストを作成
const SettingsContext = createContext<SettingsContextType>({
  breadcrumbsMode: 'history',
  setBreadcrumbsMode: () => {},
  isBreadcrumbsEnabled: true,
  setIsBreadcrumbsEnabled: () => {},
});

// コンテキストを使用するためのフック
export const useSettings = () => useContext(SettingsContext);

// プロバイダーコンポーネント
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // localStorageからの初期値取得（クライアントサイドのみ）
  const [breadcrumbsMode, setBreadcrumbsModeState] = useState<'history' | 'location'>('history');
  const [isBreadcrumbsEnabled, setIsBreadcrumbsEnabledState] = useState<boolean>(true);
  
  // マウント時に localStorage から設定を読み込む
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('breadcrumbsMode');
      if (savedMode && (savedMode === 'history' || savedMode === 'location')) {
        setBreadcrumbsModeState(savedMode);
      }
      
      const savedEnabled = localStorage.getItem('isBreadcrumbsEnabled');
      if (savedEnabled !== null) {
        setIsBreadcrumbsEnabledState(savedEnabled === 'true');
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error);
    }
  }, []);
  
  // 設定変更時に localStorage に保存する
  const setBreadcrumbsMode = (mode: 'history' | 'location') => {
    setBreadcrumbsModeState(mode);
    try {
      localStorage.setItem('breadcrumbsMode', mode);
    } catch (error) {
      console.error('Failed to save breadcrumbsMode to localStorage:', error);
    }
  };
  
  const setIsBreadcrumbsEnabled = (enabled: boolean) => {
    setIsBreadcrumbsEnabledState(enabled);
    try {
      localStorage.setItem('isBreadcrumbsEnabled', String(enabled));
    } catch (error) {
      console.error('Failed to save isBreadcrumbsEnabled to localStorage:', error);
    }
  };
  
  return (
    <SettingsContext.Provider
      value={{
        breadcrumbsMode,
        setBreadcrumbsMode,
        isBreadcrumbsEnabled,
        setIsBreadcrumbsEnabled,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;
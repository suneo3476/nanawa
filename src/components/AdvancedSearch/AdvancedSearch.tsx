'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, MapPin, Music, Album, Filter, X } from 'lucide-react';
import type { Live } from '@/types/live';
import type { Song } from '@/types/song';
import type { SetlistItem } from '@/types/setlist';
import { LiveCard } from '@/components/LiveCard/LiveCard';
import { SongCard } from '@/components/SongCard/SongCard';

interface AdvancedSearchProps {
  lives: Live[];
  songs: Song[];
  setlists: SetlistItem[];
}

export default function AdvancedSearch({ lives, songs, setlists }: AdvancedSearchProps) {
  // 検索条件
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    venue: '',
    yearStart: '',
    yearEnd: '',
    album: '',
    playedMoreThan: '',
    playedLessThan: '',
  });

  // 検索結果
  const [searchResults, setSearchResults] = useState<{
    lives: Live[];
    songs: (Song & { playCount: number })[];
  }>({ lives: [], songs: [] });
  
  // 表示件数の状態
  const [displayCount, setDisplayCount] = useState({
    lives: 6,
    songs: 6
  });

  // アクティブなフィルター数
  const activeFiltersCount = useMemo(() => {
    return Object.values(searchParams).filter(v => v !== '').length;
  }, [searchParams]);

  // 会場のユニークなリスト（オプション用）
  const uniqueVenues = useMemo(() => {
    return Array.from(new Set(lives.map(live => live.venue))).sort();
  }, [lives]);

  // アルバムのユニークなリスト（オプション用）
  const uniqueAlbums = useMemo(() => {
    return Array.from(new Set(songs.map(song => song.album).filter(Boolean))).sort();
  }, [songs]);

  // フォーム送信イベント
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // 検索実行時に表示件数をリセット
    setDisplayCount({
      lives: 6,
      songs: 6
    });
    
    // フィルタリングされたライブ
    const filteredLives = lives.filter(live => {
      // キーワード検索（イベント名、会場名）
      if (searchParams.keyword && 
          !live.name.toLowerCase().includes(searchParams.keyword.toLowerCase()) &&
          !live.venue.toLowerCase().includes(searchParams.keyword.toLowerCase())) {
        return false;
      }
      
      // 会場検索
      if (searchParams.venue && 
          live.venue !== searchParams.venue) {
        return false;
      }
      
      // 年の範囲検索
      const liveYear = new Date(live.date).getFullYear();
      if (searchParams.yearStart && liveYear < parseInt(searchParams.yearStart)) {
        return false;
      }
      if (searchParams.yearEnd && liveYear > parseInt(searchParams.yearEnd)) {
        return false;
      }
      
      // アルバム検索（このライブで演奏されたいずれかの曲が指定アルバムに含まれるか）
      if (searchParams.album) {
        const liveSongIds = setlists
          .filter(item => item.liveId === live.liveId)
          .map(item => item.songId);
        
        const liveSongs = songs.filter(song => liveSongIds.includes(song.songId));
        
        if (!liveSongs.some(song => song.album === searchParams.album)) {
          return false;
        }
      }
      
      return true;
    });
    
    // フィルタリングされたライブで演奏された曲のIDを収集
    const liveIds = filteredLives.map(live => live.liveId);
    
    // 各曲の演奏回数をカウント
    const songPlayCounts: Record<string, number> = {};
    setlists.forEach(item => {
      if (liveIds.includes(item.liveId)) {
        songPlayCounts[item.songId] = (songPlayCounts[item.songId] || 0) + 1;
      }
    });
    
    // フィルタリングされた曲
    const filteredSongs = songs
      .map(song => ({
        ...song,
        playCount: songPlayCounts[song.songId] || 0
      }))
      .filter(song => {
        // 演奏されていない曲は除外
        if (song.playCount === 0) return false;
        
        // アルバム検索
        if (searchParams.album && song.album !== searchParams.album) {
          return false;
        }
        
        // 演奏回数のフィルタリング
        if (searchParams.playedMoreThan && 
            song.playCount < parseInt(searchParams.playedMoreThan)) {
          return false;
        }
        if (searchParams.playedLessThan && 
            song.playCount > parseInt(searchParams.playedLessThan)) {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => b.playCount - a.playCount);
    
    setSearchResults({
      lives: filteredLives,
      songs: filteredSongs
    });
  };

  // 検索条件の更新
  const handleChangeSearchParam = (
    key: keyof typeof searchParams,
    value: string
  ) => {
    setSearchParams(prev => ({ ...prev, [key]: value }));
  };

  // フィルタークリア
  const clearFilters = () => {
    setSearchParams({
      keyword: '',
      venue: '',
      yearStart: '',
      yearEnd: '',
      album: '',
      playedMoreThan: '',
      playedLessThan: '',
    });
    
    // 表示件数もリセット
    setDisplayCount({
      lives: 6,
      songs: 6
    });
  };

  // 最小年と最大年（検索フィルター用）
  const [yearRange, setYearRange] = useState<{ min: number; max: number }>({
    min: 2000,
    max: new Date().getFullYear(),
  });

  // ライブデータから年範囲を取得
  useEffect(() => {
    if (lives.length > 0) {
      const years = lives.map(live => new Date(live.date).getFullYear());
      setYearRange({
        min: Math.min(...years),
        max: Math.max(...years),
      });
    }
  }, [lives]);

  // 初回マウント時に検索実行
  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSearch} className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">詳細検索</h2>
          
          {/* キーワード検索 */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="キーワードで検索（ライブ名、会場名など）"
              value={searchParams.keyword}
              onChange={(e) => handleChangeSearchParam('keyword', e.target.value)}
              className="pl-10 w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 会場フィルター */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <MapPin size={16} className="text-purple-500" />
                会場
              </label>
              <select
                value={searchParams.venue}
                onChange={(e) => handleChangeSearchParam('venue', e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value="">すべての会場</option>
                {uniqueVenues.map((venue) => (
                  <option key={venue} value={venue}>
                    {venue}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 期間フィルター */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Calendar size={16} className="text-purple-500" />
                期間
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={searchParams.yearStart}
                  onChange={(e) => handleChangeSearchParam('yearStart', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="">開始年</option>
                  {Array.from({ length: yearRange.max - yearRange.min + 1 }, (_, i) => yearRange.min + i).map((year) => (
                    <option key={`start-${year}`} value={year}>
                      {year}年
                    </option>
                  ))}
                </select>
                <span className="text-gray-500">～</span>
                <select
                  value={searchParams.yearEnd}
                  onChange={(e) => handleChangeSearchParam('yearEnd', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="">終了年</option>
                  {Array.from({ length: yearRange.max - yearRange.min + 1 }, (_, i) => yearRange.min + i).map((year) => (
                    <option key={`end-${year}`} value={year}>
                      {year}年
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* アルバムフィルター */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Album size={16} className="text-purple-500" />
                アルバム
              </label>
              <select
                value={searchParams.album}
                onChange={(e) => handleChangeSearchParam('album', e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              >
                <option value="">すべてのアルバム</option>
                {uniqueAlbums.map((album) => (
                  <option key={album} value={album}>
                    {album}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 演奏回数フィルター */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Music size={16} className="text-purple-500" />
                演奏回数
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="最小"
                  min="1"
                  value={searchParams.playedMoreThan}
                  onChange={(e) => handleChangeSearchParam('playedMoreThan', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
                <span className="text-gray-500">～</span>
                <input
                  type="number"
                  placeholder="最大"
                  min="1"
                  value={searchParams.playedLessThan}
                  onChange={(e) => handleChangeSearchParam('playedLessThan', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-purple-500" />
              <span className="text-sm text-gray-600">
                {activeFiltersCount > 0 
                  ? `${activeFiltersCount}個のフィルターが適用中` 
                  : 'フィルターなし'}
              </span>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                >
                  <X size={14} />
                  クリア
                </button>
              )}
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <button
                type="button"
                onClick={clearFilters}
                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                リセット
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                検索
              </button>
            </div>
          </div>
        </form>
      </div>
      
      {/* 検索結果 */}
      <div className="space-y-8">
        {/* ライブ検索結果 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              ライブ検索結果
              <span className="ml-2 text-sm font-normal text-gray-500">
                {searchResults.lives.length}件
              </span>
            </h2>
          </div>
          
          {searchResults.lives.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.lives.slice(0, displayCount.lives).map((live) => (
                <LiveCard key={live.liveId} live={live} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
              条件に一致するライブが見つかりませんでした。
            </div>
          )}
          
          {searchResults.lives.length > displayCount.lives && (
            <div className="mt-4 text-center flex justify-center gap-3">
              <button 
                onClick={() => setDisplayCount(prev => ({ ...prev, lives: prev.lives + 6 }))}
                className="px-4 py-2 text-sm text-purple-600 hover:text-purple-700 border border-purple-200 rounded-full hover:bg-purple-50"
              >
                さらに表示（+{searchResults.lives.length - displayCount.lives}件）
              </button>
              <button 
                onClick={() => setDisplayCount(prev => ({ ...prev, lives: searchResults.lives.length }))}
                className="px-4 py-2 text-sm text-orange-600 hover:text-orange-700 border border-orange-200 rounded-full hover:bg-orange-50"
              >
                すべて表示（{searchResults.lives.length}件）
              </button>
            </div>
          )}
        </div>
        
        {/* 楽曲検索結果 */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              楽曲検索結果
              <span className="ml-2 text-sm font-normal text-gray-500">
                {searchResults.songs.length}件
              </span>
            </h2>
          </div>
          
          {searchResults.songs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.songs.slice(0, displayCount.songs).map((song) => (
                <SongCard
                  key={song.songId}
                  song={song}
                  stats={{ 
                    playCount: song.playCount,
                    // ここに初演奏と最終演奏の情報を追加できる
                    // 現在の実装ではダミーデータを使用
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
              条件に一致する楽曲が見つかりませんでした。
            </div>
          )}
          
          {searchResults.songs.length > displayCount.songs && (
            <div className="mt-4 text-center flex justify-center gap-3">
              <button 
                onClick={() => setDisplayCount(prev => ({ ...prev, songs: prev.songs + 6 }))}
                className="px-4 py-2 text-sm text-purple-600 hover:text-purple-700 border border-purple-200 rounded-full hover:bg-purple-50"
              >
                さらに表示（+{searchResults.songs.length - displayCount.songs}件）
              </button>
              <button 
                onClick={() => setDisplayCount(prev => ({ ...prev, songs: searchResults.songs.length }))}
                className="px-4 py-2 text-sm text-orange-600 hover:text-orange-700 border border-orange-200 rounded-full hover:bg-orange-50"
              >
                すべて表示（{searchResults.songs.length}件）
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
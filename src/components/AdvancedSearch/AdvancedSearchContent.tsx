// components/AdvancedSearch/AdvancedSearchContent.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Calendar, Building2, Disc, Hash, Filter } from 'lucide-react';
import LiveCard from '@/components/LiveCard';
import SongCard from '@/components/SongCard';
import type { Live } from '@/types/live';
import type { Song } from '@/types/song';
import type { SetlistItem } from '@/types/setlist';

interface AdvancedSearchContentProps {
  lives: Live[];
  songs: Song[];
  setlists: SetlistItem[];
}

/**
 * 詳細検索の実装コンポーネント
 * useSearchParamsを使用してクエリパラメータを処理
 */
export default function AdvancedSearchContent({ 
  lives, 
  songs, 
  setlists 
}: AdvancedSearchContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 検索条件の状態
  const [searchValues, setSearchValues] = useState({
    keyword: searchParams.get('keyword') || '',
    venue: searchParams.get('venue') || '',
    yearStart: searchParams.get('yearStart') || '',
    yearEnd: searchParams.get('yearEnd') || '',
    album: searchParams.get('album') || '',
    playedMoreThan: searchParams.get('playedMoreThan') ? 
      parseInt(searchParams.get('playedMoreThan') || '0', 10) : 0,
    playedLessThan: searchParams.get('playedLessThan') ? 
      parseInt(searchParams.get('playedLessThan') || '0', 10) : 0,
  });
  
  // 検索結果の状態
  const [searchResults, setSearchResults] = useState<{
    lives: Live[];
    songs: (Song & { playCount: number })[];
  }>({ lives: [], songs: [] });
  
  // 表示制限（「もっと見る」ボタン用）
  const [displayLimit, setDisplayLimit] = useState({
    lives: 6,
    songs: 6
  });
  
  // 入力値を状態に反映
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchValues(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // URLクエリパラメータを更新
  const updateQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    
    // 値が空でないパラメータのみ追加
    if (searchValues.keyword) params.set('keyword', searchValues.keyword);
    if (searchValues.venue) params.set('venue', searchValues.venue);
    if (searchValues.yearStart) params.set('yearStart', searchValues.yearStart);
    if (searchValues.yearEnd) params.set('yearEnd', searchValues.yearEnd);
    if (searchValues.album) params.set('album', searchValues.album);
    if (searchValues.playedMoreThan > 0) params.set('playedMoreThan', searchValues.playedMoreThan.toString());
    if (searchValues.playedLessThan > 0) params.set('playedLessThan', searchValues.playedLessThan.toString());
    
    // URLを更新（履歴に追加）
    router.push(`?${params.toString()}`);
  }, [router, searchValues]);
  
  // 検索実行関数
  const handleSearch = useCallback(() => {
    // URLクエリパラメータを更新
    updateQueryParams();
    
    // ライブのフィルタリング
    const filteredLives = filterLives();
    
    // 楽曲のフィルタリング
    const filteredSongs = filterSongs(filteredLives);
    
    // 検索結果を更新
    setSearchResults({
      lives: filteredLives,
      songs: filteredSongs
    });
    
    // 表示制限をリセット
    setDisplayLimit({
      lives: 6,
      songs: 6
    });
  }, [updateQueryParams]);
  
  // ライブデータをフィルタリング
  const filterLives = useCallback(() => {
    return lives.filter(live => {
      // キーワード検索（イベント名、会場名）
      if (searchValues.keyword && 
          !live.name.toLowerCase().includes(searchValues.keyword.toLowerCase()) &&
          !live.venue.toLowerCase().includes(searchValues.keyword.toLowerCase())) {
        return false;
      }
      
      // 会場検索
      if (searchValues.venue && 
          !live.venue.toLowerCase().includes(searchValues.venue.toLowerCase())) {
        return false;
      }
      
      // 年の範囲検索
      const liveYear = new Date(live.date.replace(/\//g, '-')).getFullYear();
      if (searchValues.yearStart && liveYear < parseInt(searchValues.yearStart, 10)) {
        return false;
      }
      if (searchValues.yearEnd && liveYear > parseInt(searchValues.yearEnd, 10)) {
        return false;
      }
      
      // アルバム検索（このライブで演奏されたいずれかの曲が指定アルバムに含まれるか）
      if (searchValues.album) {
        const liveSongs = getLiveSongs(live.liveId);
        const hasAlbumSong = liveSongs.some(song => 
          song.album && song.album.toLowerCase().includes(searchValues.album.toLowerCase())
        );
        if (!hasAlbumSong) return false;
      }
      
      return true;
    });
  }, [lives, searchValues]);
  
  // 楽曲データをフィルタリング
  const filterSongs = useCallback((filteredLives: Live[]) => {
    // 選択されたライブで演奏された曲のIDを収集
    const liveIds = filteredLives.map(live => live.liveId);
    const songIds = new Set<string>();
    
    setlists
      .filter(item => liveIds.includes(item.liveId))
      .forEach(item => songIds.add(item.songId));
    
    // 演奏回数を計算
    const playCounts: Record<string, number> = {};
    songs.forEach(song => {
      playCounts[song.songId] = setlists.filter(
        item => item.songId === song.songId && liveIds.includes(item.liveId)
      ).length;
    });
    
    return songs
      .filter(song => {
        // 演奏された曲のみ
        if (!songIds.has(song.songId)) return false;
        
        // アルバム検索
        if (searchValues.album && 
            (!song.album || !song.album.toLowerCase().includes(searchValues.album.toLowerCase()))) {
          return false;
        }
        
        // 演奏回数のフィルタリング
        const count = playCounts[song.songId] || 0;
        if (searchValues.playedMoreThan > 0 && count < searchValues.playedMoreThan) {
          return false;
        }
        if (searchValues.playedLessThan > 0 && count > searchValues.playedLessThan) {
          return false;
        }
        
        return true;
      })
      .map(song => ({
        ...song,
        playCount: playCounts[song.songId] || 0
      }))
      .sort((a, b) => b.playCount - a.playCount);
  }, [setlists, songs, searchValues]);
  
  // あるライブで演奏された曲を取得
  const getLiveSongs = useCallback((liveId: string): Song[] => {
    const songIds = setlists
      .filter(item => item.liveId === liveId)
      .map(item => item.songId);
      
    return songs.filter(song => songIds.includes(song.songId));
  }, [setlists, songs]);
  
  // 「もっと見る」ボタンのハンドラ
  const handleShowMore = (type: 'lives' | 'songs') => {
    setDisplayLimit(prev => ({
      ...prev,
      [type]: prev[type] + 6
    }));
  };
  
  // マウント時と検索条件変更時に検索を実行
  useEffect(() => {
    handleSearch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // フォーム送信時の処理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };
  
  return (
    <div>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="form-group">
          <label className="block text-gray-700 mb-1 text-sm font-medium" htmlFor="keyword">
            <div className="flex items-center gap-1">
              <Search size={16} />
              <span>キーワード検索</span>
            </div>
          </label>
          <input 
            type="text" 
            id="keyword" 
            name="keyword"
            value={searchValues.keyword}
            onChange={handleInputChange}
            placeholder="ライブ名や会場名を入力"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div className="form-group">
          <label className="block text-gray-700 mb-1 text-sm font-medium" htmlFor="venue">
            <div className="flex items-center gap-1">
              <Building2 size={16} />
              <span>会場</span>
            </div>
          </label>
          <input 
            type="text" 
            id="venue" 
            name="venue"
            value={searchValues.venue}
            onChange={handleInputChange}
            placeholder="会場名を入力"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div className="form-group">
          <label className="block text-gray-700 mb-1 text-sm font-medium">
            <div className="flex items-center gap-1">
              <Calendar size={16} />
              <span>期間</span>
            </div>
          </label>
          <div className="flex gap-2">
            <input 
              type="number" 
              name="yearStart"
              value={searchValues.yearStart}
              onChange={handleInputChange}
              placeholder="開始年"
              min="2000"
              max="2030"
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <span className="self-center">～</span>
            <input 
              type="number" 
              name="yearEnd"
              value={searchValues.yearEnd}
              onChange={handleInputChange}
              placeholder="終了年"
              min="2000"
              max="2030"
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label className="block text-gray-700 mb-1 text-sm font-medium" htmlFor="album">
            <div className="flex items-center gap-1">
              <Disc size={16} />
              <span>アルバム</span>
            </div>
          </label>
          <input 
            type="text" 
            id="album" 
            name="album"
            value={searchValues.album}
            onChange={handleInputChange}
            placeholder="アルバム名を入力"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        
        <div className="form-group">
          <label className="block text-gray-700 mb-1 text-sm font-medium">
            <div className="flex items-center gap-1">
              <Hash size={16} />
              <span>演奏回数</span>
            </div>
          </label>
          <div className="flex gap-2">
            <input 
              type="number" 
              name="playedMoreThan"
              value={searchValues.playedMoreThan || ''}
              onChange={handleInputChange}
              placeholder="最小回数"
              min="0"
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <span className="self-center">～</span>
            <input 
              type="number" 
              name="playedLessThan"
              value={searchValues.playedLessThan || ''}
              onChange={handleInputChange}
              placeholder="最大回数"
              min="0"
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        
        <div className="md:col-span-2 flex justify-center mt-2">
          <button 
            type="submit" 
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Filter size={16} />
            <span>検索する</span>
          </button>
        </div>
      </form>
      
      <div className="search-results space-y-8">
        <div className="result-section">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-6 bg-gradient-to-b from-purple-600 to-pink-500 rounded-full inline-block"></span>
            ライブ ({searchResults.lives.length}件)
          </h3>
          
          {searchResults.lives.length === 0 ? (
            <p className="text-gray-500 py-4 text-center bg-gray-50 rounded-lg">該当するライブはありません</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.lives.slice(0, displayLimit.lives).map(live => (
                  <LiveCard key={live.liveId} live={live} />
                ))}
              </div>
              
              {searchResults.lives.length > displayLimit.lives && (
                <div className="text-center mt-4">
                  <button 
                    onClick={() => handleShowMore('lives')}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors"
                  >
                    さらに表示 ({searchResults.lives.length - displayLimit.lives}件)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="result-section">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-6 bg-gradient-to-b from-purple-600 to-pink-500 rounded-full inline-block"></span>
            楽曲 ({searchResults.songs.length}件)
          </h3>
          
          {searchResults.songs.length === 0 ? (
            <p className="text-gray-500 py-4 text-center bg-gray-50 rounded-lg">該当する楽曲はありません</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.songs.slice(0, displayLimit.songs).map(song => (
                  <SongCard 
                    key={song.songId} 
                    song={song} 
                    stats={{ playCount: song.playCount }}
                  />
                ))}
              </div>
              
              {searchResults.songs.length > displayLimit.songs && (
                <div className="text-center mt-4">
                  <button 
                    onClick={() => handleShowMore('songs')}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm font-medium transition-colors"
                  >
                    さらに表示 ({searchResults.songs.length - displayLimit.songs}件)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
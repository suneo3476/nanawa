// src/components/AdvancedSearch/SearchForm.tsx
import React from 'react';
import { Search, Calendar, MapPin, Music, Album, Filter, X, Youtube } from 'lucide-react';
import { SearchParams } from './utils/searchUtils';

interface SearchFormProps {
  searchParams: SearchParams;
  onChangeSearchParam: (key: keyof SearchParams, value: string) => void;
  onSearch: (e?: React.FormEvent) => void;
  onClearFilters: () => void;
  uniqueVenues: string[];
  uniqueAlbums: string[];
  yearRange: { min: number; max: number };
  activeFiltersCount: number;
}

const SearchForm: React.FC<SearchFormProps> = ({
  searchParams,
  onChangeSearchParam,
  onSearch,
  onClearFilters,
  uniqueVenues,
  uniqueAlbums,
  yearRange,
  activeFiltersCount,
}) => {
  return (
    <form onSubmit={onSearch} className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">詳細検索</h2>
      
      {/* Keyword search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="キーワードで検索（ライブ名、会場名など）"
          value={searchParams.keyword}
          onChange={(e) => onChangeSearchParam('hasYoutubeVideos', e.target.checked ? 'true' : '')}
          className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500"        
      />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Venue filter */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <MapPin size={16} className="text-purple-500" />
            会場
          </label>
          <select
            value={searchParams.venue}
            onChange={(e) => onChangeSearchParam('venue', e.target.value)}
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
        
        {/* Period filter */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Calendar size={16} className="text-purple-500" />
            期間
          </label>
          <div className="flex items-center gap-2">
            <select
              value={searchParams.yearStart}
              onChange={(e) => onChangeSearchParam('yearStart', e.target.value)}
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
              onChange={(e) => onChangeSearchParam('yearEnd', e.target.value)}
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
        
        {/* Album filter */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Album size={16} className="text-purple-500" />
            アルバム
          </label>
          <select
            value={searchParams.album}
            onChange={(e) => onChangeSearchParam('album', e.target.value)}
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
        
        {/* Play count filter */}
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
              onChange={(e) => onChangeSearchParam('playedMoreThan', e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
            <span className="text-gray-500">～</span>
            <input
              type="number"
              placeholder="最大"
              min="1"
              value={searchParams.playedLessThan}
              onChange={(e) => onChangeSearchParam('playedLessThan', e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Youtube Filter */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Youtube size={16} className="text-red-500" />
            YouTube動画
          </label>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={searchParams.hasYoutubeVideos}
              onChange={(e) => onChangeSearchParam('hasYoutubeVideos', e.target.checked ? 'true' : '')}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label className="ml-2 text-sm text-gray-600">
              YouTubeの動画があるライブのみ表示
            </label>
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
              onClick={onClearFilters}
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
            onClick={onClearFilters}
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
  );
};

export default SearchForm;
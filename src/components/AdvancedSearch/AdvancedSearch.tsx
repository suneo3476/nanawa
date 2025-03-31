// src/components/AdvancedSearch/AdvancedSearch.tsx

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import type { Live } from '@/types/live';
import type { Song } from '@/types/song';
import type { SetlistItem } from '@/types/setlist';

import SearchForm from './SearchForm';
import SearchResultsSection from './SearchResults/SearchResultsSection';
import { 
  SearchParams, 
  SearchResults, 
  filterLives, 
  filterSongs, 
  getUniqueVenues, 
  getUniqueAlbums, 
  getYearRange 
} from './utils/searchUtils';

interface AdvancedSearchProps {
  lives: Live[];
  songs: Song[];
  setlists: SetlistItem[];
}

export default function AdvancedSearch({ lives, songs, setlists }: AdvancedSearchProps) {
  // Search parameters state
  const [searchParams, setSearchParams] = useState<SearchParams>({
    keyword: '',
    venue: '',
    yearStart: '',
    yearEnd: '',
    album: '',
    playedMoreThan: '',
    playedLessThan: '',
    hasYoutubeVideos: false // Initialize new parameter
  });

  // Search results state
  const [searchResults, setSearchResults] = useState<SearchResults>({ 
    lives: [], 
    songs: [] 
  });
  
  // Display count state
  const [displayCount, setDisplayCount] = useState({
    lives: 6,
    songs: 6
  });

  // Get unique venues and albums for filter options
  const uniqueVenues = useMemo(() => getUniqueVenues(lives), [lives]);
  const uniqueAlbums = useMemo(() => getUniqueAlbums(songs), [songs]);
  
  // Count active filters
  const activeFiltersCount = useMemo(() => {
    return Object.values(searchParams).filter(v => v !== '').length;
  }, [searchParams]);

  // Get year range for year filters
  const yearRange = useMemo(() => getYearRange(lives), [lives]);

  // Search form submission handler
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Reset display count when searching
    setDisplayCount({
      lives: 6,
      songs: 6
    });
    
    // Filter lives
    const filteredLives = filterLives(lives, songs, setlists, searchParams);
    
    // Get IDs of filtered lives
    const liveIds = filteredLives.map(live => live.id);
    
    // Filter songs based on filtered lives
    const filteredSongs = filterSongs(songs, setlists, searchParams, liveIds);
    
    setSearchResults({
      lives: filteredLives,
      songs: filteredSongs
    });
  };

  // Search parameter change handler
  const handleChangeSearchParam = (
    key: keyof SearchParams,
    value: any
  ) => {
    setSearchParams(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchParams({
      keyword: '',
      venue: '',
      yearStart: '',
      yearEnd: '',
      album: '',
      playedMoreThan: '',
      playedLessThan: '',
      hasYoutubeVideos: false
    });
    
    // Reset display count
    setDisplayCount({
      lives: 6,
      songs: 6
    });
  };

  // Load more items handler
  const handleLoadMore = (type: 'lives' | 'songs') => {
    setDisplayCount(prev => ({
      ...prev,
      [type]: prev[type] + 6
    }));
  };

  // Load all items handler
  const handleLoadAll = (type: 'lives' | 'songs') => {
    setDisplayCount(prev => ({
      ...prev,
      [type]: searchResults[type].length
    }));
  };

  // Run search on initial mount
  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <SearchForm
          searchParams={searchParams}
          onChangeSearchParam={handleChangeSearchParam}
          onSearch={handleSearch}
          onClearFilters={clearFilters}
          uniqueVenues={uniqueVenues}
          uniqueAlbums={uniqueAlbums}
          yearRange={yearRange}
          activeFiltersCount={activeFiltersCount}
        />
      </div>
      
      {/* Search Results */}
      <SearchResultsSection
        results={searchResults}
        displayCount={displayCount}
        onLoadMore={handleLoadMore}
        onLoadAll={handleLoadAll}
      />
    </div>
  );
}
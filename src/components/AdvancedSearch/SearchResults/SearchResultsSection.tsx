// src/components/AdvancedSearch/SearchResults/SearchResultsSection.tsx
import React from 'react';
import LiveSearchResults from './LiveSearchResults';
import SongSearchResults from './SongSearchResults';
import type { Live } from '@/types/live';
import type { Song } from '@/types/song';

interface SearchResultsSectionProps {
  results: {
    lives: Live[];
    songs: (Song & { playCount: number })[];
  };
  displayCount: {
    lives: number;
    songs: number;
  };
  onLoadMore: (type: 'lives' | 'songs') => void;
  onLoadAll: (type: 'lives' | 'songs') => void;
}

const SearchResultsSection: React.FC<SearchResultsSectionProps> = ({
  results,
  displayCount,
  onLoadMore,
  onLoadAll
}) => {
  return (
    <div className="space-y-8">
      {/* Live search results */}
      <LiveSearchResults
        lives={results.lives}
        displayCount={displayCount.lives}
        onLoadMore={() => onLoadMore('lives')}
        onLoadAll={() => onLoadAll('lives')}
      />
      
      {/* Song search results */}
      <SongSearchResults
        songs={results.songs}
        displayCount={displayCount.songs}
        onLoadMore={() => onLoadMore('songs')}
        onLoadAll={() => onLoadAll('songs')}
      />
    </div>
  );
};

export default SearchResultsSection;
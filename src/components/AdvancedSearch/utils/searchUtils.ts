// src/components/AdvancedSearch/utils/searchUtils.ts
import type { Live } from '@/types/live';
import type { Song } from '@/types/song';
import type { SetlistItem } from '@/types/setlist';

export interface SearchParams {
  keyword: string;
  venue: string;
  yearStart: string;
  yearEnd: string;
  album: string;
  playedMoreThan: string;
  playedLessThan: string;
}

export interface SearchResults {
  lives: Live[];
  songs: (Song & { playCount: number })[];
}

export function filterLives(
  lives: Live[],
  songs: Song[],
  setlists: SetlistItem[],
  searchParams: SearchParams
): Live[] {
  return lives.filter(live => {
    // Keyword search (event name, venue name)
    if (searchParams.keyword && 
        !live.eventName.toLowerCase().includes(searchParams.keyword.toLowerCase()) &&
        !live.venueName.toLowerCase().includes(searchParams.keyword.toLowerCase())) {
      return false;
    }
    
    // Venue search
    if (searchParams.venue && 
        live.venueName !== searchParams.venue) {
      return false;
    }
    
    // Year range search
    const liveYear = new Date(live.date).getFullYear();
    if (searchParams.yearStart && liveYear < parseInt(searchParams.yearStart)) {
      return false;
    }
    if (searchParams.yearEnd && liveYear > parseInt(searchParams.yearEnd)) {
      return false;
    }
    
    // Album search (check if any song played in this live is from the specified album)
    if (searchParams.album) {
      const liveSongIds = setlists
        .filter(item => item.liveId === live.id)
        .map(item => item.songId);
      
      const liveSongs = songs.filter(song => liveSongIds.includes(song.id));
      
      if (!liveSongs.some(song => song.album === searchParams.album)) {
        return false;
      }
    }
    
    return true;
  });
}

export function filterSongs(
  songs: Song[],
  setlists: SetlistItem[],
  searchParams: SearchParams,
  filteredLiveIds: string[]
): (Song & { playCount: number })[] {
  // Count song performances in filtered lives
  const songPlayCounts: Record<string, number> = {};
  setlists.forEach(item => {
    if (filteredLiveIds.includes(item.liveId)) {
      songPlayCounts[item.songId] = (songPlayCounts[item.songId] || 0) + 1;
    }
  });
  
  // Filter and enhance songs with play count
  return songs
    .map(song => ({
      ...song,
      playCount: songPlayCounts[song.id] || 0
    }))
    .filter(song => {
      // Exclude songs that weren't played
      if (song.playCount === 0) return false;
      
      // Album filter
      if (searchParams.album && song.album !== searchParams.album) {
        return false;
      }
      
      // Play count filters
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
}

export function getUniqueVenues(lives: Live[]): string[] {
  return Array.from(new Set(lives.map(live => live.venueName))).sort();
}

export function getUniqueAlbums(songs: Song[]): string[] {
  return Array.from(new Set(songs.map(song => song.album).filter(Boolean))).sort();
}

export function getYearRange(lives: Live[]): { min: number; max: number } {
  if (lives.length === 0) {
    return { min: 2000, max: new Date().getFullYear() };
  }
  const years = lives.map(live => new Date(live.date).getFullYear());
  return {
    min: Math.min(...years),
    max: Math.max(...years),
  };
}
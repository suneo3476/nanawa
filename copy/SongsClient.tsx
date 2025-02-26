'use client';

import { useRouter } from 'next/navigation';
import { SongCard } from '@/components/SongCard/SongCard';
import type { Song } from '@/types/song';

type SongsClientProps = {
  songs: {
    song: Song;
    stats: {
      playCount: number;
      firstPlay?: {
        liveName: string;
        date: string;
      };
      lastPlay?: {
        liveName: string;
        date: string;
      };
    };
  }[];
};

export const SongsClient = ({ songs }: SongsClientProps) => {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {songs.map(({ song, stats }) => (
        <SongCard 
          key={song.songId} 
          song={song}
          stats={stats}
          onSelect={(songId) => router.push(`/songs/${songId}`)}
        />
      ))}
    </div>
  );
};

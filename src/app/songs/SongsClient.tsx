// src/app/songs/SongsClient.tsx

'use client';

import { useRouter } from 'next/navigation';
import { SongCard } from '@/components/SongCard';
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

  // 曲データに絵文字を追加
  const songsWithEmoji = songs.map(({ song, stats }) => ({
    song: {
      ...song,
      // タイトルに絵文字を追加 (すでに絵文字がなければ)
      title: song.title.startsWith('🎵') ? song.title : `🎵 ${song.title}`
    },
    stats
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {songsWithEmoji.map(({ song, stats }) => (
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

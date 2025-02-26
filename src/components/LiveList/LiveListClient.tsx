'use client';

import { LiveCard } from '../LiveCard/LiveCard';
import type { Live } from '@/types/live';
import type { Song } from '@/types/song';
import { useRouter } from 'next/navigation';

type LiveListClientProps = {
  lives: (Live & {
    setlist?: Pick<Song, 'songId' | 'title'>[];
  })[];
};

export const LiveListClient = ({ lives }: LiveListClientProps) => {
  const router = useRouter();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {lives.map(live => (
        <LiveCard 
          key={live.liveId} 
          live={live}
          onSelect={(liveId) => router.push(`/lives/${liveId}`)}
        />
      ))}
    </div>
  );
};

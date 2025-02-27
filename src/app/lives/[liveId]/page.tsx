// src/app/lives/[liveId]/page.tsx
import { Header } from '@/components/Header/Header';
import { notFound } from 'next/navigation';
import { CalendarDays, MapPin, MessageCircle, Music } from 'lucide-react';
import Link from 'next/link';

type Props = {
  params: {
    liveId: string;
  };
};

// ライブの詳細情報を取得
async function getLiveDetails(liveId: string) {
  try {
    const [livesRes, setlistsRes, songsRes] = await Promise.all([
      fetch('http://localhost:3000/api/lives', { next: { revalidate: 3600 } }),
      fetch('http://localhost:3000/api/setlists', { next: { revalidate: 3600 } }),
      fetch('http://localhost:3000/api/songs', { next: { revalidate: 3600 } })
    ]);
    
    if (!livesRes.ok || !setlistsRes.ok || !songsRes.ok) {
      throw new Error('データの取得に失敗しました');
    }
    
    const lives = await livesRes.json();
    const setlists = await setlistsRes.json();
    const songs = await songsRes.json();
    
    // 指定されたIDのライブを検索
    const live = lives.find((l) => l.liveId === liveId);
    if (!live) return null;
    
    // このライブのセットリスト
    const liveSetlist = setlists
      .filter((item) => item.liveId === liveId)
      .sort((a, b) => a.order - b.order);
    
    // セットリストに曲情報を付与
    const setlistWithSongs = liveSetlist.map((item) => {
      const song = songs.find((s) => s.songId === item.songId);
      return {
        ...item,
        song: song || { songId: item.songId, title: '不明な曲', album: '', releaseDate: '' }
      };
    });
    
    return {
      live,
      setlist: setlistWithSongs
    };
  } catch (error) {
    console.error('ライブ詳細取得エラー:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const data = await getLiveDetails(params.liveId);
  
  if (!data) {
    return {
      title: 'ライブが見つかりません | 七輪',
    };
  }
  
  return {
    title: `${data.live.name} | 七輪`,
    description: `${data.live.date}に${data.live.venue}で開催されたライブの詳細`,
  };
}

export default async function LiveDetailPage({ params }: Props) {
  const data = await getLiveDetails(params.liveId);
  
  if (!data) {
    notFound();
  }
  
  // 日付の整形
  const formattedDate = new Date(data.live.date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{data.live.name}</h1>
          
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <CalendarDays className="text-purple-500" size={24} />
                <div>
                  <div className="text-sm text-gray-500">開催日</div>
                  <div className="font-medium">{formattedDate}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="text-purple-500" size={24} />
                <div>
                  <div className="text-sm text-gray-500">会場</div>
                  <div className="font-medium">{data.live.venue}</div>
                </div>
              </div>
              {data.live.memo && (
                <div className="flex items-start gap-3 md:col-span-2">
                  <MessageCircle className="text-purple-500 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <div className="text-sm text-gray-500">メモ</div>
                    <div className="font-medium">{data.live.memo}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <section className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">セットリスト</h2>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Music size={16} />
                <span>全{data.setlist.length}曲</span>
              </div>
            </div>
            
            {data.setlist.length === 0 ? (
              <p className="text-gray-500">セットリスト情報がありません</p>
            ) : (
              <ol className="space-y-4">
                {data.setlist.map((item, index) => (
                  <li 
                    key={`${item.songId}-${index}`}
                    className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className="flex-none w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700"
                        aria-label={`${index + 1}曲目`}
                      >
                        {index + 1}
                      </span>
                      <div className="flex-grow">
                        <Link 
                          href={`/songs/${item.songId}`}
                          className="text-lg font-semibold hover:text-purple-600 transition-colors"
                        >
                          {item.song.title}
                        </Link>
                        {item.song.album && (
                          <p className="text-sm text-gray-600">{item.song.album}</p>
                        )}
                        {item.memo && (
                          <p className="mt-2 text-gray-500 text-sm">{item.memo}</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
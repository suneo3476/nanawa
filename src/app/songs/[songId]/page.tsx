import Link from 'next/link';
import { Header } from '@/components/Header/Header';
import { notFound } from 'next/navigation';
import { Music, Calendar, Disc } from 'lucide-react';

type Props = {
  params: {
    songId: string;
  };
};

// 特定の楽曲の詳細情報を取得
async function getSongDetails(songId: string) {
  try {
    const [songsRes, setlistsRes, livesRes] = await Promise.all([
      fetch('http://localhost:3000/api/songs', { next: { revalidate: 3600 } }),
      fetch('http://localhost:3000/api/setlists', { next: { revalidate: 3600 } }),
      fetch('http://localhost:3000/api/lives', { next: { revalidate: 3600 } })
    ]);
    
    if (!songsRes.ok || !setlistsRes.ok || !livesRes.ok) {
      throw new Error('データの取得に失敗しました');
    }
    
    const songs = await songsRes.json();
    const setlists = await setlistsRes.json();
    const lives = await livesRes.json();
    
    // 指定されたIDの楽曲を検索
    const song = songs.find((s) => s.songId === songId);
    if (!song) return null;
    
    // この曲が含まれるセットリスト
    const songSetlists = setlists.filter((item) => item.songId === songId);
    
    // 演奏回数
    const playCount = songSetlists.length;
    
    // 演奏履歴
    const performances = songSetlists.map((item) => {
      const live = lives.find((l) => l.liveId === item.liveId);
      
      // このライブのセットリスト全体を取得して曲数を計算
      const liveAllSetlists = setlists.filter((s) => s.liveId === item.liveId);
      const totalSongs = liveAllSetlists.length;
      
      return {
        liveId: item.liveId,
        liveName: live ? live.name : '不明なライブ',
        date: live ? live.date : '',
        memo: item.memo,
        order: item.order,
        totalSongs: totalSongs
      };
    });

    // 日付で降順ソート（最新順）
    performances.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // 初演奏と最終演奏
    const sortedByDate = [...performances].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const firstPlay = sortedByDate[0];
    const lastPlay = sortedByDate[sortedByDate.length - 1];
    
    return {
      song,
      stats: {
        playCount,
        firstPlay: firstPlay ? {
          liveName: firstPlay.liveName,
          date: firstPlay.date
        } : undefined,
        lastPlay: lastPlay && lastPlay !== firstPlay ? {
          liveName: lastPlay.liveName,
          date: lastPlay.date
        } : undefined
      },
      performances
    };
  } catch (error) {
    console.error('楽曲詳細取得エラー:', error);
    return null;
  }
}

export async function generateMetadata({ params }: Props) {
  const data = await getSongDetails(params.songId);
  
  if (!data) {
    return {
      title: '楽曲が見つかりません | 七輪',
    };
  }
  
  return {
    title: `${data.song.title} | 七輪`,
    description: `${data.song.title}の演奏履歴と統計情報`,
  };
}

export default async function SongDetailPage({ params }: Props) {
  const data = await getSongDetails(params.songId);
  
  if (!data) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{data.song.title}</h1>
          
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Disc className="text-purple-500" size={24} />
                <div>
                  <div className="text-sm text-gray-500">アルバム</div>
                  <div className="font-medium">{data.song.album || '不明'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="text-purple-500" size={24} />
                <div>
                  <div className="text-sm text-gray-500">リリース日</div>
                  <div className="font-medium">{data.song.releaseDate || '不明'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Music className="text-purple-500" size={24} />
                <div>
                  <div className="text-sm text-gray-500">演奏回数</div>
                  <div className="font-medium">{data.stats.playCount}回</div>
                </div>
              </div>
            </div>
          </div>

          <section className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold mb-4">演奏履歴</h2>
            {data.performances.length === 0 ? (
              <p className="text-gray-500">演奏履歴がありません</p>
            ) : (
              <div className="space-y-4">
                {data.performances.map((performance, index) => (
                  <div
                    key={`${performance.liveId}-${index}`}
                    className="border-b border-gray-100 last:border-0 pb-4 last:pb-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Link href={`/lives/${performance.liveId}`} className="font-medium hover:text-purple-600 transition-colors">
                        {performance.liveName}
                      </Link>
                      <div className="flex items-center gap-3">
                        <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {performance.order} / {performance.totalSongs}曲目
                        </span>
                        <time className="text-sm text-gray-500">{performance.date}</time>
                      </div>
                    </div>
                    {performance.memo && (
                      <p className="text-sm text-gray-600">{performance.memo}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
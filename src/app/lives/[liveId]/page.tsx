// src/app/lives/[liveId]/page.tsx

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { SetlistView } from '@/components/SetlistView';
import { 
  getLiveById, 
  getLiveWithSetlist, 
  getAllLiveIds, 
  loadAlbumsData,
  loadAlbumTracksData,
  getSongById
} from '@/utils/static-data-loader';

// 動的メタデータの生成
export async function generateMetadata({ 
  params 
}: { 
  params: { liveId: string } 
}): Promise<Metadata> {
  const live = getLiveById(params.liveId);
  
  if (!live) {
    return {
      title: 'ライブが見つかりません | 七輪アーカイブ',
    };
  }
  
  return {
    title: `${live.eventName} | 七輪アーカイブ`,
    description: `${live.date}に${live.venueName}で開催された七輪ライブの詳細・セットリスト情報`,
  };
}

// 静的生成のためのパラメータを取得
export async function generateStaticParams() {
  const liveIds = getAllLiveIds();
  return liveIds;
}

// ライブヘッダーコンポーネント
const LiveHeader = ({ live }: { live: any }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">{live.eventName}</h1>
      
      <div className="mt-4 space-y-2 text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar aria-hidden="true" size={18} className="text-purple-500" />
          <time dateTime={live.date}>{live.date}</time>
        </div>
        <div className="flex items-center gap-2">
          <MapPin aria-hidden="true" size={18} className="text-purple-500" />
          <span>{live.venueName}</span>
        </div>
        {live.memo && (
          <div className="mt-2 p-3 bg-gray-50 rounded-lg text-gray-700">
            {live.memo}
          </div>
        )}
      </div>
    </div>
  );
};

// 前後のライブへのナビゲーションコンポーネント
const LiveNavigation = ({ prevLive, nextLive }: { prevLive: any; nextLive: any }) => {
  return (
    <div className="flex justify-between mt-8">
      <div>
        {prevLive && (
          <Link 
            href={`/lives/${prevLive.id}`}
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800"
          >
            <ChevronLeft size={16} />
            <div>
              <div className="text-xs text-gray-500">{prevLive.date}</div>
              <div>{prevLive.eventName}</div>
            </div>
          </Link>
        )}
      </div>
      <div>
        {nextLive && (
          <Link 
            href={`/lives/${nextLive.id}`}
            className="inline-flex items-center gap-2 text-right text-purple-600 hover:text-purple-800"
          >
            <div>
              <div className="text-xs text-gray-500">{nextLive.date}</div>
              <div>{nextLive.eventName}</div>
            </div>
            <ChevronRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
};

// メインのライブ詳細ページコンポーネント
export default function LivePage({ params }: { params: { liveId: string } }) {
  const liveId = params.liveId;
  
  // ライブデータの取得
  const live = getLiveWithSetlist(liveId);
  
  if (!live) {
    notFound();
  }
  
  // 前後のライブを取得（日付順）
  const allLives = getAllLiveIds().map(({ liveId }) => getLiveById(liveId));
  const sortedLives = allLives
    .filter(Boolean) // Add this to filter out null values
    .sort((a, b) => new Date(a?.date || '').getTime() - new Date(b?.date || '').getTime());
  
  const currentIndex = sortedLives.findIndex(l => l?.id === liveId);    
  const prevLive = currentIndex > 0 ? sortedLives[currentIndex - 1] : null;
  const nextLive = currentIndex < sortedLives.length - 1 ? sortedLives[currentIndex + 1] : null;
  
  // アルバム情報を取得
  const albums = loadAlbumsData();
  const albumTracks = loadAlbumTracksData();

  // 曲ごとに収録アルバム情報を作成
  const setlistWithAlbums = live.setlist.map(item => {
    console.table(item);
    const song = getSongById(item.songId);
    
    // この曲が収録されているアルバム情報を収集
    const songAlbumTracks = albumTracks.filter(track => track.songId === item.songId);
    const albumIds = songAlbumTracks.map(track => track.albumId);
    const songAlbums = albums
      .filter(album => albumIds.includes(album.id))
      .map(album => album.title);
    
    return {
      order: item.order,
      songId: item.songId,
      songTitle: item.title,  // title を songTitle にマッピング
      albums: songAlbums, 
      isSingle: song?.isSingle,
      memo: item.memo,
      youtubeUrl: item.youtubeUrl  // YouTubeリンクを追加
    };
  });
  
  console.log("デバッグ - セットリスト情報:", JSON.stringify(setlistWithAlbums, null, 2));
  
  return (
    <div className="space-y-8">
      {/* ライブ情報表示部分 */}
      <LiveHeader live={live} />
      
      {/* セットリスト表示部分 */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">セットリスト</h2>
        <SetlistView setlist={setlistWithAlbums} date={live.date} />
      </div>
      
      {/* 前後のライブへのナビゲーション部分 */}
      <LiveNavigation prevLive={prevLive} nextLive={nextLive} />
    </div>
  );
}
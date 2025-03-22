// src/app/lives/[liveId]/page.tsx

import { Suspense } from 'react';
import { 
  getLiveById, 
  getSetlistForLive, 
  getAllLiveIds,
  loadLivesData
} from '@/utils/static-data-loader';
import { SetlistView } from '@/components/SetlistView/SetlistView';
import { CalendarDays, MapPin, MessageCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';

// メタデータを動的に生成
export async function generateMetadata(
  { params }: { params: { liveId: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const live = getLiveById(params.liveId);
  
  if (!live) {
    return {
      title: 'ライブが見つかりません | 七輪アーカイブ',
    };
  }
  
  return {
    title: `${live.name} | 七輪アーカイブ`,
    description: `${live.date}に${live.venue}で開催された「${live.name}」のライブ情報とセットリスト。`,
  };
}

// ビルド時に全ライブページを静的生成するためのパラメータを取得
export function generateStaticParams() {
  const liveIds = getAllLiveIds();
  return liveIds;
}

export default async function LivePage({ params }: { params: { liveId: string } }) {
  const liveId = params.liveId;
  const live = getLiveById(liveId);
  
  // ライブが見つからない場合は404ページへ
  if (!live) {
    notFound();
  }
  
  // セットリスト情報を取得
  const setlist = await getSetlistForLive(liveId);
  
  // 前後のライブを取得
  const allLives = loadLivesData();
  const sortedLives = allLives.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const currentIndex = sortedLives.findIndex(l => l.liveId === liveId);
  
  const previousLive = currentIndex > 0 ? sortedLives[currentIndex - 1] : null;
  const nextLive = currentIndex < sortedLives.length - 1 ? sortedLives[currentIndex + 1] : null;
  
  // 日付のフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };
  
  return (
    <div className="space-y-8">
      {/* ライブ情報ヘッダー */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">{live.name}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-gray-600">
              <CalendarDays aria-hidden="true" size={20} className="text-purple-500" />
              <time dateTime={live.date} className="text-lg">{formatDate(live.date)}</time>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin aria-hidden="true" size={20} className="text-purple-500" />
              <span className="text-lg">{live.venue}</span>
            </div>
            
            {live.memo && (
              <div className="flex items-start gap-2 text-gray-600">
                <MessageCircle aria-hidden="true" size={20} className="text-purple-500 flex-shrink-0 mt-1" />
                <div className="text-base">{live.memo}</div>
              </div>
            )}
          </div>
          
          {/* ナビゲーションリンク */}
          <div className="flex flex-col gap-3 justify-end">
            {previousLive && (
              <Link 
                href={`/lives/${previousLive.liveId}`} 
                className="flex items-center justify-start gap-2 text-purple-600 hover:text-purple-800 transition-colors"
              >
                <ArrowLeft size={18} />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">前のライブ</span>
                  <span>{previousLive.name}</span>
                  <span className="text-xs text-gray-500">{previousLive.date}</span>
                </div>
              </Link>
            )}
            
            {nextLive && (
              <Link 
                href={`/lives/${nextLive.liveId}`} 
                className="flex items-center justify-end gap-2 text-purple-600 hover:text-purple-800 transition-colors"
              >
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-500">次のライブ</span>
                  <span>{nextLive.name}</span>
                  <span className="text-xs text-gray-500">{nextLive.date}</span>
                </div>
                <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* セットリスト */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">セットリスト</h2>
        
        <Suspense fallback={<div className="text-gray-500">セットリスト情報を読み込み中...</div>}>
          <SetlistView 
            setlist={setlist.map(item => ({
              order: item.order,
              songId: item.song.songId,
              songTitle: item.song.title,
              albums: item.song.appearsOn || [item.song.album],
              isSingle: item.song.isSingle,
              memo: item.memo
            }))}
            date={live.date}
          />
        </Suspense>
      </div>
      
      {/* 戻るリンク */}
      <div className="flex justify-center">
        <Link
          href="/search"
          className="inline-flex items-center px-4 py-2 border border-purple-300 text-sm font-medium rounded-md text-purple-700 bg-white hover:bg-purple-50"
        >
          ライブ一覧に戻る
        </Link>
      </div>
    </div>
  );
}
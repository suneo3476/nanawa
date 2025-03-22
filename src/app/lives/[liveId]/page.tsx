// src/app/lives/[liveId]/page.tsx

import { Suspense } from 'react';
import { Metadata } from 'next';
import { getLiveById, getSetlistForLive, getAllLiveIds } from '@/utils/static-data-loader';
import { SetlistView } from '@/components/SetlistView/SetlistView';  // パスを修正
import { Calendar, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

// 静的ページ生成のためのパラメータを取得
export async function generateStaticParams() {
  const lives = getAllLiveIds();
  return lives;
}

// 動的メタデータの生成
export async function generateMetadata({ params }: { params: { liveId: string } }): Promise<Metadata> {
  const liveId = await params.liveId;
  const live = getLiveById(liveId);
  
  if (!live) {
    return {
      title: 'ライブが見つかりません | 七輪アーカイブ',
      description: '指定されたライブ情報は存在しないか、削除された可能性があります。',
    };
  }
  
  return {
    title: `${live.eventName} | 七輪アーカイブ`,
    description: `${live.date} @ ${live.venueName} のライブ情報とセットリスト`,
  };
}

export default async function LiveDetailPage({ params }: { params: { liveId: string } }) {
  const liveId = await params.liveId;
  const live = getLiveById(liveId);
  
  if (!live) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 my-6">
        <h1 className="text-2xl font-bold mb-4 text-red-500">ライブが見つかりません</h1>
        <p className="text-gray-600">
          指定されたライブ情報は存在しないか、削除された可能性があります。
        </p>
      </div>
    );
  }
  
  // セットリスト情報の取得
  const setlistItems = getSetlistForLive(liveId);
  
  // 表示に必要な形式に変換
  const formattedSetlist = setlistItems.map(item => ({
    order: item.order,
    songId: item.song.id,
    songTitle: item.song.title,
    albums: [item.song.album].filter(Boolean),
    isSingle: item.song.isSingle,
    memo: item.memo
  }));
  
  // 日付のフォーマット変換
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };
  
  // 前後のライブ取得ロジックは省略
  // ...
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{live.eventName}</h1>
            <div className="mt-4 space-y-2 text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar aria-hidden="true" size={18} className="text-purple-500" />
                <time dateTime={live.date}>{formatDate(live.date)}</time>
              </div>
              <div className="flex items-center gap-2">
                <MapPin aria-hidden="true" size={18} className="text-purple-500" />
                <span>{live.venueName}</span>
              </div>
              {live.memo && (
                <div className="mt-2 text-sm text-gray-500">{live.memo}</div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">セットリスト</h2>
        <Suspense fallback={<div>セットリスト読み込み中...</div>}>
          <SetlistView setlist={formattedSetlist} date={live.date} />
        </Suspense>
      </div>
      
      {/* 前後のライブへのナビゲーションは省略 */}
    </div>
  );
}
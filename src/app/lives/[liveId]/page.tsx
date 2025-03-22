// src/app/lives/[liveId]/page.tsx

import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import { getLiveById, getSetlistForLive } from '@/utils/static-data-loader';
import { SetlistView } from '@/components/SetlistView/SetlistView';

/**
 * 静的生成のためのパラメータを生成
 */
export async function generateStaticParams() {
  // 静的ビルド時に利用可能なすべてのliveIdを返す
  // 実際の実装はstatic-data-loader.tsの getAllLiveIds 関数で行われる
  const { getAllLiveIds } = await import('@/utils/static-data-loader');
  const liveIds = getAllLiveIds();
  return liveIds;
}

/**
 * メタデータを生成（SEO対応）
 */
export async function generateMetadata(
  { params }: { params: { liveId: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Next.js 15では params を await する必要がある
  const liveId = (await params).liveId;
  const live = getLiveById(liveId);
  
  if (!live) {
    return {
      title: 'ライブが見つかりません',
      description: '指定されたライブは存在しないか、削除された可能性があります。',
    };
  }
  
  return {
    title: `${live.name} | 七輪アーカイブ`,
    description: `${live.date} @ ${live.venue} のライブ情報とセットリスト`,
  };
}

export default async function LivePage({ params }: { params: { liveId: string } }) {
  // Next.js 15では params を await する必要がある
  const liveId = (await params).liveId;
  const live = getLiveById(liveId);
  
  // ライブが見つからない場合は404ページへ
  if (!live) {
    notFound();
  }
  
  // セットリスト情報を取得
  const setlist = await getSetlistForLive(liveId);
  
  // フォーマット日付（YYYY-MM-DD → YYYY年MM月DD日）
  const formattedDate = live.date.replace(
    /(\d{4})-(\d{2})-(\d{2})/,
    '$1年$2月$3日'
  );
  
  // セットリストビュー用のデータ構造に変換
  const setlistItems = setlist.map(item => ({
    order: item.order,
    songId: item.song.songId,
    songTitle: item.song.title,
    albums: item.song.appearsOn || [item.song.album],
    isSingle: item.song.isSingle,
    memo: item.memo
  }));
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{live.name}</h1>
        
        <div className="space-y-4">
          {/* ライブ情報 */}
          <div className="flex flex-wrap gap-4 text-gray-600">
            <div className="flex items-center gap-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-5 h-5 text-purple-500"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                />
              </svg>
              <time dateTime={live.date}>{formattedDate}</time>
            </div>
            
            <div className="flex items-center gap-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-5 h-5 text-purple-500"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                />
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                />
              </svg>
              <span>{live.venue}</span>
            </div>
          </div>
          
          {/* メモがあれば表示 */}
          {live.memo && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-purple-800">{live.memo}</p>
            </div>
          )}
          
          {/* セットリスト表示 */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">セットリスト</h2>
            <SetlistView setlist={setlistItems} date={live.date} />
          </div>
        </div>
      </div>
    </div>
  );
}
// src/app/songs/[songId]/page.tsx

import { Suspense } from 'react';
import { 
  getSongById, 
  getSongWithPerformances,
  getAllSongIds,
  getLiveById
} from '@/utils/static-data-loader';
import { Music, Calendar, Disc, BarChart } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';
import { LiveCard } from '@/components/LiveCard/LiveCard';
import SongPerformanceChartWrapper from '@/components/SongPerformanceChart/SongPerformanceChartWrapper';

// メタデータを動的に生成
export async function generateMetadata(
  { params }: { params: { songId: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const song = await getSongById(params.songId);
  
  if (!song) {
    return {
      title: '楽曲が見つかりません | 七輪アーカイブ',
    };
  }
  
  return {
    title: `${song.title} | 七輪アーカイブ`,
    description: `${song.title}の演奏履歴と詳細情報。${song.album || ''}に収録、七輪での演奏回数や初演奏/最終演奏情報を確認できます。`,
  };
}

// ビルド時に全楽曲ページを静的生成するためのパラメータを取得
export async function generateStaticParams() {
  const songIds = await getAllSongIds();
  return songIds;
}

export default async function SongPage({ params }: { params: { songId: string } }) {
  const songId = params.songId;
  const songWithPerformances = await getSongWithPerformances(songId);
  
  // 楽曲が見つからない場合は404ページへ
  if (!songWithPerformances) {
    notFound();
  }
  
  const { performances, ...song } = songWithPerformances;
  
  // 年別の演奏回数データを生成
  const yearlyPerformanceData = performances.history.reduce((acc, performance) => {
    const year = new Date(performance.date).getFullYear();
    acc[year] = (acc[year] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  // チャート用データを整形
  const chartData = Object.entries(yearlyPerformanceData)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  
  // 最新の演奏ライブを5件取得
  const recentLives = performances.history
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
    .map(perf => {
      const live = getLiveById(perf.liveId);
      return live ? {
        ...live,
        highlight: song.title // ハイライト表示する曲名
      } : null;
    })
    .filter(Boolean);
  
  // 日付のフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // 収録作品リストを整形
  const albumList = song.appearsOn || [song.album];
  
  return (
    <div className="space-y-8">
      {/* 楽曲情報ヘッダー */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🎵 {song.title}</h1>
          
          <div className="flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg">
            <Music size={18} />
            <span className="font-medium">{performances.count}回演奏</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Disc size={18} className="text-purple-500" />
              基本情報
            </h2>
            
            <div className="space-y-3 ml-6">
              {song.album && (
                <div>
                  <div className="text-sm text-gray-500">収録アルバム</div>
                  <div className="text-gray-800 font-medium">{song.album}</div>
                </div>
              )}
              
              {song.releaseDate && (
                <div>
                  <div className="text-sm text-gray-500">リリース日</div>
                  <div className="text-gray-800">{formatDate(song.releaseDate)}</div>
                </div>
              )}
              
              {song.isSingle !== undefined && (
                <div>
                  <div className="text-sm text-gray-500">リリースタイプ</div>
                  <div className="text-gray-800">
                    {song.isSingle ? 'シングル曲' : 'アルバム曲'}
                  </div>
                </div>
              )}
              
              {albumList.length > 0 && (
                <div>
                  <div className="text-sm text-gray-500">全収録作品</div>
                  <div className="text-gray-800 space-y-1">
                    {albumList.map((album, index) => (
                      <div key={index} className="text-sm bg-gray-50 px-2 py-1 rounded">
                        {album}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <BarChart size={18} className="text-purple-500" />
              演奏統計
            </h2>
            
            <div className="space-y-3 ml-6">
              {performances.firstPerformance && (
                <div>
                  <div className="text-sm text-gray-500">初演奏</div>
                  <div className="text-gray-800">
                    {formatDate(performances.firstPerformance.date)} - {performances.firstPerformance.liveName}
                  </div>
                </div>
              )}
              
              {performances.lastPerformance && (
                <div>
                  <div className="text-sm text-gray-500">最終演奏</div>
                  <div className="text-gray-800">
                    {formatDate(performances.lastPerformance.date)} - {performances.lastPerformance.liveName}
                  </div>
                </div>
              )}
              
              <div>
                <div className="text-sm text-gray-500">演奏頻度</div>
                <div className="text-gray-800">
                  平均 {performances.count > 0 ? 
                    `${(performances.count / Object.keys(yearlyPerformanceData).length).toFixed(1)}回/年` : 
                    '0回/年'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 演奏回数の推移グラフ - クライアントコンポーネントラッパー経由 */}
      {chartData.length > 0 && (
        <Suspense fallback={<div className="h-72 bg-gray-100 rounded animate-pulse"></div>}>
          <SongPerformanceChartWrapper chartData={chartData} />
        </Suspense>
      )}
      
      {/* 最近の演奏ライブ */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar size={20} className="text-purple-500" />
            最近の演奏履歴
          </h2>
          
          <Link 
            href={`/search?song=${songId}`}
            className="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            すべての演奏履歴
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right">
              <path d="M5 12h14"></path>
              <path d="m12 5 7 7-7 7"></path>
            </svg>
          </Link>
        </div>
        
        {recentLives.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentLives.map(live => (
              <LiveCard 
                key={live.liveId} 
                live={live as any}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            演奏履歴はありません
          </div>
        )}
      </div>
      
      {/* 戻るリンク */}
      <div className="flex justify-center">
        <Link
          href="/search"
          className="inline-flex items-center px-4 py-2 border border-purple-300 text-sm font-medium rounded-md text-purple-700 bg-white hover:bg-purple-50"
        >
          楽曲一覧に戻る
        </Link>
      </div>
    </div>
  );
}
// src/app/songs/[songId]/page.tsx

import { Suspense } from 'react';
import { Metadata } from 'next';
import { getSongById, getAllSongIds, getSongWithPerformances, getSongAlbums } from '@/utils/static-data-loader';
import { Music, Disc, CalendarRange } from 'lucide-react';
import SongPerformanceChartWrapper from '@/components/SongPerformanceChart/SongPerformanceChartWrapper';

// 静的ページ生成のためのパラメータを取得
export async function generateStaticParams() {
  const songs = getAllSongIds();
  return songs;
}

// 動的メタデータの生成
export async function generateMetadata({ params }: { params: { songId: string } }): Promise<Metadata> {
  const songId = await params.songId;
  const song = getSongById(songId);
  
  if (!song) {
    return {
      title: '楽曲が見つかりません | 七輪アーカイブ',
      description: '指定された楽曲情報は存在しないか、削除された可能性があります。',
    };
  }
  
  return {
    title: `${song.title} | 七輪アーカイブ`,
    description: `${song.title}の演奏履歴と収録アルバム情報`,
  };
}

export default async function SongDetailPage({ params }: { params: { songId: string } }) {
  const songId = await params.songId;
  const song = getSongWithPerformances(songId);
  
  if (!song) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 my-6">
        <h1 className="text-2xl font-bold mb-4 text-red-500">楽曲が見つかりません</h1>
        <p className="text-gray-600">
          指定された楽曲情報は存在しないか、削除された可能性があります。
        </p>
      </div>
    );
  }
  
  // 収録アルバム情報の取得
  const albums = getSongAlbums(songId);
  
  // リリース情報の表示
  const formatDate = (dateString?: string) => {
    if (!dateString) return "不明";
    return dateString;
  };
  
  // 年別演奏回数のチャートデータ作成
  const chartData = getYearlyPerformanceData(song);
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{song.title}</h1>
            
            <div className="mt-4 space-y-3 text-gray-600">
              {/* アルバム情報 */}
              <div className="flex items-start gap-2">
                <Disc size={18} className="text-purple-500 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium">収録アルバム</div>
                  <div>
                    {albums.length > 0 ? (
                      <div className="space-y-1">
                        {albums.map(album => (
                          <div key={album.id} className="text-sm">
                            {album.title}
                            <span className="text-gray-500 ml-2">
                              ({album.subCategory}・{album.category}・{formatDate(album.releaseDate)})
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">情報なし</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* リリース情報 */}
              <div className="flex items-start gap-2">
                <CalendarRange size={18} className="text-purple-500 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium">リリース情報</div>
                  <div className="text-sm">
                    {formatDate(song.releaseDate)}
                    {song.isSingle && <span className="ml-2 text-orange-500">（シングル曲）</span>}
                  </div>
                </div>
              </div>
              
              {/* 演奏統計 */}
              <div className="flex items-start gap-2">
                <Music size={18} className="text-purple-500 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium">演奏統計</div>
                  <div className="text-sm">
                    <div>演奏回数: <span className="font-medium">{song.performances.count}回</span></div>
                    {song.performances.firstPerformance && (
                      <div>初演奏: {song.performances.firstPerformance.date} ({song.performances.firstPerformance.liveName})</div>
                    )}
                    {song.performances.lastPerformance && (
                      <div>最終演奏: {song.performances.lastPerformance.date} ({song.performances.lastPerformance.liveName})</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 演奏チャート */}
      <Suspense fallback={<div className="bg-white rounded-xl shadow-sm p-6 py-10 text-center">チャート読み込み中...</div>}>
        <SongPerformanceChartWrapper chartData={chartData} />
      </Suspense>
      
      {/* 演奏履歴リスト - 略 */}
    </div>
  );
}

// 年別演奏回数データを作成する関数
function getYearlyPerformanceData(song: any) {
  if (!song.performances || !song.performances.history) {
    return [];
  }
  
  const yearCounts: Record<string, number> = {};
  
  // 演奏履歴から年別にカウント
  song.performances.history.forEach((perf: any) => {
    const year = perf.date.substring(0, 4);
    yearCounts[year] = (yearCounts[year] || 0) + 1;
  });
  
  // チャート用のデータ形式に変換
  return Object.entries(yearCounts)
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year.localeCompare(b.year));
}
// src/app/songs/[songId]/page.tsx

import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import { getSongWithPerformances } from '@/utils/static-data-loader';
import SongPerformanceChartWrapper from '@/components/SongPerformanceChart/SongPerformanceChartWrapper';

/**
 * 静的生成のためのパラメータを生成
 */
export async function generateStaticParams() {
  // 静的ビルド時に利用可能なすべてのsongIdを返す
  const { getAllSongIds } = await import('@/utils/static-data-loader');
  const songIds = await getAllSongIds();
  return songIds;
}

/**
 * メタデータを生成（SEO対応）
 */
export async function generateMetadata(
  { params }: { params: { songId: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Next.js 15では params を await する必要がある
  const songId = (await params).songId;
  
  try {
    const song = await getSongWithPerformances(songId);
    
    if (!song) {
      return {
        title: '楽曲が見つかりません',
        description: '指定された楽曲は存在しないか、削除された可能性があります。',
      };
    }
    
    return {
      title: `${song.title} | 七輪アーカイブ`,
      description: `七輪による"${song.title}"の演奏履歴と統計情報。${song.performances.count}回演奏。`,
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: '楽曲情報',
      description: '七輪アーカイブの楽曲詳細ページ',
    };
  }
}

export default async function SongPage({ params }: { params: { songId: string } }) {
  // Next.js 15では params を await する必要がある
  const songId = (await params).songId;
  
  try {
    // 楽曲情報を取得（演奏履歴付き）
    const song = await getSongWithPerformances(songId);
    
    // 楽曲が見つからない場合は404ページへ
    if (!song) {
      notFound();
    }
    
    // 年別演奏回数のデータを生成
    const yearlyPerformances = generateYearlyPerformanceData(song);
    
    // 最初と最後の演奏履歴
    const firstPerformance = song.performances.firstPerformance;
    const lastPerformance = song.performances.lastPerformance;
    
    return (
      <div className="space-y-6">
        {/* 楽曲情報ヘッダー */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{song.title}</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">楽曲情報</h2>
              <dl className="space-y-2">
                {song.album && (
                  <div className="flex flex-col">
                    <dt className="text-sm text-gray-500">主要収録</dt>
                    <dd className="text-purple-700">{song.album}</dd>
                  </div>
                )}
                
                {song.releaseDate && (
                  <div className="flex flex-col">
                    <dt className="text-sm text-gray-500">リリース日</dt>
                    <dd className="text-gray-700">{formatDate(song.releaseDate)}</dd>
                  </div>
                )}
                
                {song.isSingle !== undefined && (
                  <div className="flex flex-col">
                    <dt className="text-sm text-gray-500">カテゴリ</dt>
                    <dd className="text-gray-700">
                      {song.isSingle ? 'シングル曲' : 'アルバム曲'}
                      {song.albumCategory && ` (${song.albumCategory})`}
                    </dd>
                  </div>
                )}
                
                {song.appearsOn && song.appearsOn.length > 0 && (
                  <div className="flex flex-col">
                    <dt className="text-sm text-gray-500">収録作品</dt>
                    <dd className="text-gray-700">{song.appearsOn.join(', ')}</dd>
                  </div>
                )}
              </dl>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">演奏統計</h2>
              <dl className="space-y-2">
                <div className="flex flex-col">
                  <dt className="text-sm text-gray-500">演奏回数</dt>
                  <dd className="text-2xl font-bold text-purple-600">{song.performances.count}回</dd>
                </div>
                
                {firstPerformance && (
                  <div className="flex flex-col">
                    <dt className="text-sm text-gray-500">初演奏</dt>
                    <dd className="text-gray-700">
                      {formatDate(firstPerformance.date)} - {firstPerformance.liveName}
                    </dd>
                  </div>
                )}
                
                {lastPerformance && (
                  <div className="flex flex-col">
                    <dt className="text-sm text-gray-500">最終演奏</dt>
                    <dd className="text-gray-700">
                      {formatDate(lastPerformance.date)} - {lastPerformance.liveName}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
        
        {/* 年別演奏回数チャート */}
        {yearlyPerformances.length > 0 && (
          <SongPerformanceChartWrapper chartData={yearlyPerformances} />
        )}
      </div>
    );
  } catch (error) {
    console.error('Error rendering song page:', error);
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">エラーが発生しました</h1>
        <p className="text-gray-600">楽曲情報の読み込み中にエラーが発生しました。</p>
      </div>
    );
  }
}

/**
 * 日付をフォーマット（YYYY-MM-DD → YYYY年MM月DD日）
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return '不明';
  
  const match = dateStr.match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
  if (!match) return dateStr;
  
  const [_, year, month, day] = match;
  
  if (year && month && day) {
    return `${year}年${parseInt(month)}月${parseInt(day)}日`;
  } else if (year && month) {
    return `${year}年${parseInt(month)}月`;
  } else {
    return `${year}年`;
  }
}

/**
 * 年別演奏回数データを生成
 */
function generateYearlyPerformanceData(song: any) {
  if (!song.performances || !song.performances.history) {
    return [];
  }
  
  const yearCounts: Record<string, number> = {};
  
  // 年ごとの演奏回数を集計
  song.performances.history.forEach((perf: any) => {
    const year = perf.date.substring(0, 4);
    yearCounts[year] = (yearCounts[year] || 0) + 1;
  });
  
  // 年の範囲を取得
  const years = Object.keys(yearCounts).sort();
  
  if (years.length === 0) {
    return [];
  }
  
  const minYear = parseInt(years[0]);
  const maxYear = parseInt(years[years.length - 1]);
  
  // 全ての年を埋める（データがない年も表示）
  const result = [];
  for (let year = minYear; year <= maxYear; year++) {
    result.push({
      year: year.toString(),
      count: yearCounts[year.toString()] || 0
    });
  }
  
  return result;
}
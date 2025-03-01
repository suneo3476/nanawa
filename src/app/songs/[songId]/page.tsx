// src/app/songs/[songId]/page.tsx (必要に応じて修正)
import React from 'react';
import { fetchSongData } from '@/utils/api'; // APIから曲データを取得する関数

export default async function SongPage({ params }: { params: { songId: string } }) {
  const songData = await fetchSongData(params.songId);
  const songTitle = songData.title.startsWith('🎵') 
  ? songData.title 
  : `🎵 ${songData.title}`;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h1 className="text-2xl font-bold mb-2">{songTitle}</h1>
      
      {/* アルバム情報 */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">収録作品</h2>
        {songData.formattedAppearances && songData.formattedAppearances.length > 0 ? (
          <ul className="space-y-2">
            {songData.formattedAppearances.map((appearance, index) => (
              <li key={index} className="bg-purple-50 p-3 rounded-lg">
                {appearance}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">収録作品情報はありません</p>
        )}
      </div>
      
      {/* 演奏履歴 */}
      <div>
        <h2 className="text-lg font-semibold mb-2">演奏履歴</h2>
        {songData.performances && songData.performances.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-2 px-3 text-left border-b border-gray-200">日付</th>
                  <th className="py-2 px-3 text-left border-b border-gray-200">イベント</th>
                  <th className="py-2 px-3 text-left border-b border-gray-200">会場</th>
                </tr>
              </thead>
              <tbody>
                {songData.performances.map((perf, index) => (
                  <tr key={index} className={index % 2 === 0 ? '' : 'bg-gray-50'}>
                    <td className="py-2 px-3 border-b border-gray-200">{perf.date}</td>
                    <td className="py-2 px-3 border-b border-gray-200">{perf.name}</td>
                    <td className="py-2 px-3 border-b border-gray-200">{perf.venue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">演奏履歴はありません</p>
        )}
      </div>
    </div>
  );
}
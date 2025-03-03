// src/app/songs/[songId]/page.tsx

import React from 'react';
import { fetchSongData } from '@/utils/api'; // APIから曲データを取得する関数
import type { Performance } from '@/types/song';

import { promises as fs } from 'fs';
import path from 'path';
import type { Live } from '@/types/live';
import type { Song } from '@/types/song';

type Props = {
  params: Promise<{
    songId: string;
  }>;
};

export default async function SongPage({ params }: Props) {//{ params: { songId: string } }) {
  const { songId } = await params;
  const songData = await fetchSongData(songId);
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
            {songData.formattedAppearances.map((appearance: string, index: number) => (
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
                {songData.performances.map((perf: Performance, index: number) => (
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

export async function generateStaticParams() {
  try {
    // すべての曲IDを取得
    // まず songs.json を探す
    let songsData = [];
    try {
      const songsPath = path.join(process.cwd(), 'public', 'data', 'songs.json');
      const songContent = await fs.readFile(songsPath, 'utf-8');
      songsData = JSON.parse(songContent);
    } catch (e) {
      // songs.jsonがない場合、lives.jsonからセットリスト内の曲を抽出
      const livesPath = path.join(process.cwd(), 'public', 'data', 'lives.json');
      const livesContent = await fs.readFile(livesPath, 'utf-8');
      const livesData = JSON.parse(livesContent);
      
      // セットリストから曲IDを収集
      const songIds = new Set();
      livesData.forEach((live: Live) => {
        if (live.setlist && Array.isArray(live.setlist)) {
          live.setlist.forEach((song: Song) => {
            if (song.id) songIds.add(song.id.toString());
          });
        }
      });
      
      songsData = Array.from(songIds).map(id => ({ id }));
    }
    
    // 各曲に対するパラメータを返す
    return songsData.map((song: Song) => ({
      songId: song.id.toString(),
    }));
  } catch (error) {
    console.error('Error generating song params:', error);
    // エラーが発生した場合、空の配列を返す（ビルドは進行するが、ページは生成されない）
    return [];
  }
}
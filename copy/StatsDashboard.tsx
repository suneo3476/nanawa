'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer 
} from 'recharts';
import { Filter, Calendar, Music, Disc, MapPin } from 'lucide-react';
import type { Live } from '@/types/live';
import type { Song } from '@/types/song';
import type { SetlistItem } from '@/types/setlist';

interface StatsDashboardProps {
  lives: Live[];
  songs: Song[];
  setlists: SetlistItem[];
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ 
  lives, songs, setlists 
}) => {
  // 年範囲のフィルター状態
  const [yearRange, setYearRange] = useState<{
    start: number;
    end: number;
  }>({ 
    start: 2003, 
    end: new Date().getFullYear() 
  });

  // カラーパレット
  const COLORS = [
    '#9333ea', '#a855f7', '#c084fc', '#d8b4fe', '#f0abfc',
    '#e879f9', '#ec4899', '#f472b6', '#fb7185', '#fda4af'
  ];

  // アップロードされたデータから年範囲を自動設定
  useEffect(() => {
    if (lives.length > 0) {
      const years = lives.map(live => 
        new Date(live.date).getFullYear()
      );
      setYearRange({
        start: Math.min(...years),
        end: Math.max(...years)
      });
    }
  }, [lives]);

  // フィルター適用されたライブデータ
  const filteredLives = useMemo(() => {
    return lives.filter(live => {
      const year = new Date(live.date).getFullYear();
      return year >= yearRange.start && year <= yearRange.end;
    });
  }, [lives, yearRange]);

  // フィルター適用されたセットリストデータ
  const filteredSetlists = useMemo(() => {
    const filteredLiveIds = filteredLives.map(live => live.liveId);
    return setlists.filter(item => 
      filteredLiveIds.includes(item.liveId)
    );
  }, [setlists, filteredLives]);

  // 1. 演奏回数Top10曲のデータ
  const topSongsData = useMemo(() => {
    // 曲ごとの演奏回数を計算
    const songPlayCounts: Record<string, number> = {};
    filteredSetlists.forEach(item => {
      songPlayCounts[item.songId] = (songPlayCounts[item.songId] || 0) + 1;
    });
    
    // 演奏回数順にソートして上位10曲を取得
    return Object.entries(songPlayCounts)
      .map(([songId, count]) => {
        const song = songs.find(s => s.songId === songId);
        return { 
          name: song ? song.title : '不明な曲', 
          count 
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredSetlists, songs]);

  // 2. アルバム別演奏曲分布のデータ
  const albumDistributionData = useMemo(() => {
    const albumCounts: Record<string, number> = {};
    filteredSetlists.forEach(item => {
      const song = songs.find(s => s.songId === item.songId);
      if (song) {
        const album = song.album || '不明なアルバム';
        albumCounts[album] = (albumCounts[album] || 0) + 1;
      }
    });
    
    return Object.entries(albumCounts)
      .map(([album, count], index) => ({
        name: album,
        value: count,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredSetlists, songs, COLORS]);

  // 3. 年別ライブ回数の推移データ
  const yearlyPerformancesData = useMemo(() => {
    const yearCounts: Record<string, number> = {};
    filteredLives.forEach(live => {
      const year = new Date(live.date).getFullYear().toString();
      yearCounts[year] = (yearCounts[year] || 0) + 1;
    });
    
    // 全年を埋める（データがない年も表示）
    const result = [];
    for (let year = yearRange.start; year <= yearRange.end; year++) {
      result.push({
        year: year.toString(),
        count: yearCounts[year.toString()] || 0
      });
    }
    return result;
  }, [filteredLives, yearRange]);

  // 4. 会場別ライブ回数ランキングデータ
  const venueRankingData = useMemo(() => {
    const venueCounts: Record<string, number> = {};
    filteredLives.forEach(live => {
      venueCounts[live.venue] = (venueCounts[live.venue] || 0) + 1;
    });
    
    return Object.entries(venueCounts)
      .map(([venue, count]) => ({ name: venue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredLives]);

  // カスタムツールチップコンポーネント
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow text-sm">
          <p className="font-medium">{`${label} : ${payload[0].value}回`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">七輪 演奏統計</h2>
      
      {/* 期間フィルター */}
      <div className="bg-purple-50 rounded-lg p-4 mb-8">
        <div className="flex items-center gap-2 mb-2 text-purple-700">
          <Filter size={18} />
          <h3 className="text-lg font-semibold">表示期間</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <input 
              type="number" 
              value={yearRange.start} 
              onChange={(e) => setYearRange(prev => ({ 
                ...prev, 
                start: Math.min(parseInt(e.target.value), prev.end) 
              }))}
              min="2000" 
              max={yearRange.end}
              className="w-20 px-2 py-1 border border-gray-300 rounded"
            />
            <span>～</span>
            <input 
              type="number" 
              value={yearRange.end} 
              onChange={(e) => setYearRange(prev => ({ 
                ...prev, 
                end: Math.max(parseInt(e.target.value), prev.start) 
              }))}
              min={yearRange.start} 
              max={new Date().getFullYear()}
              className="w-20 px-2 py-1 border border-gray-300 rounded"
            />
          </div>
          
          <div className="flex-1 flex items-center gap-2">
            <input 
              type="range" 
              value={yearRange.start} 
              onChange={(e) => setYearRange(prev => ({ 
                ...prev, 
                start: parseInt(e.target.value) 
              }))}
              min="2000" 
              max={yearRange.end}
              className="w-full"
            />
            <input 
              type="range" 
              value={yearRange.end} 
              onChange={(e) => setYearRange(prev => ({ 
                ...prev, 
                end: parseInt(e.target.value) 
              }))}
              min={yearRange.start} 
              max={new Date().getFullYear()}
              className="w-full"
            />
          </div>
        </div>
      </div>
      
      {/* グラフグリッド */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 1. 演奏回数Top10曲 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4 text-purple-700">
            <Music size={18} />
            <h3 className="font-semibold">演奏回数Top10曲</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topSongsData}
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 12 }} 
                  width={80} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#9333ea" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 2. アルバム別演奏曲分布 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4 text-purple-700">
            <Disc size={18} />
            <h3 className="font-semibold">アルバム別演奏曲分布</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={albumDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => 
                    `${name.length > 15 ? name.substring(0, 15) + '...' : name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {albumDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 3. 年別ライブ回数の推移 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4 text-purple-700">
            <Calendar size={18} />
            <h3 className="font-semibold">年別ライブ回数の推移</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={yearlyPerformancesData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#ec4899" 
                  activeDot={{ r: 8 }} 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* 4. 会場別ライブ回数ランキング */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4 text-purple-700">
            <MapPin size={18} />
            <h3 className="font-semibold">会場別ライブ回数ランキング</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={venueRankingData}
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 12 }} 
                  width={100} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#ec4899" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* サマリーセクション */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">統計サマリー</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 mb-1">総ライブ回数</p>
            <p className="text-2xl font-bold">{filteredLives.length}回</p>
          </div>
          
          <div className="bg-pink-50 p-4 rounded-lg">
            <p className="text-sm text-pink-600 mb-1">演奏楽曲数</p>
            <p className="text-2xl font-bold">
              {new Set(filteredSetlists.map(item => item.songId)).size}曲
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-purple-600 mb-1">平均セットリスト曲数</p>
            <p className="text-2xl font-bold">
              {filteredLives.length ? 
                (filteredSetlists.length / filteredLives.length).toFixed(1) : 0}曲
            </p>
          </div>
          
          <div className="bg-pink-50 p-4 rounded-lg">
            <p className="text-sm text-pink-600 mb-1">最も演奏された曲</p>
            <p className="text-2xl font-bold truncate">
              {topSongsData.length > 0 ? topSongsData[0].name : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
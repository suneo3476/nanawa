// src/components/SongPerformanceChart/SongPerformanceChart.tsx

'use client';

import React from 'react';
import { BarChart2, Calendar, MapPin, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

type ChartDataItem = {
  year: string;
  count: number;
};

interface SongPerformanceChartProps {
  chartData: ChartDataItem[];
  performances?: {
    history: Array<{
      liveId: string;
      date: string;
      liveName: string;
    }>;
  };
}

export default function SongPerformanceChart({ chartData, performances }: SongPerformanceChartProps) {
  if (chartData.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <BarChart2 size={20} className="text-purple-500" />
        年別演奏回数
      </h2>
      
      <div className="h-72 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip formatter={(value: any) => [`${value}回`, '演奏回数']} />
            <Bar dataKey="count" fill="#9333ea" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* 演奏ライブの一覧を表示 */}
      {performances && performances.history.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">演奏ライブ履歴</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {performances.history.map((perf) => (
              <Link
                key={perf.liveId}
                href={`/lives/${perf.liveId}`}
                className="block p-3 bg-gray-50 hover:bg-purple-50 rounded-lg border border-gray-200 hover:border-purple-200 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={14} />
                      <time dateTime={perf.date}>{perf.date}</time>
                    </div>
                    <div className="font-medium mt-1">{perf.liveName}</div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
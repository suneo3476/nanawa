'use client';

import dynamic from 'next/dynamic';

// 動的インポートとSSR無効化をクライアントコンポーネント内で行う
const SongPerformanceChart = dynamic(() => import('./SongPerformanceChart'), {
  ssr: false,
  loading: () => <div className="h-72 bg-gray-100 rounded animate-pulse"></div>
});

type ChartDataItem = {
  year: string;
  count: number;
};

interface SongPerformanceChartWrapperProps {
  chartData: ChartDataItem[];
}

// ラッパーコンポーネント
export default function SongPerformanceChartWrapper({ chartData }: SongPerformanceChartWrapperProps) {
  return <SongPerformanceChart chartData={chartData} />;
}
// src/components/PerformanceHeatmap/HeatmapLegend.tsx

import React from 'react';

const HeatmapLegend: React.FC = () => {
  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-1 text-xs">
      {/* リリース前の色の説明 */}
      <div className="flex items-center gap-1 text-xs text-gray-600">
        <span className="text-gray-500">リリース前：</span>
        <div className="w-3 h-3 bg-slate-300 border border-slate-400"></div>
      </div>
      
      {/* 演奏回数による色の段階の説明 */}
      <div className="flex items-center gap-1">
        <span className="text-gray-500 text-xs">演奏回数:</span>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-slate-50 border border-slate-200"></div>
          <span className="text-xs ml-0.5">0</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-violet-200 border border-slate-200"></div>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-violet-400 border border-slate-200"></div>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-violet-600 border border-slate-200"></div>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-violet-800 border border-slate-200"></div>
          <span className="text-xs ml-0.5">多</span>
        </div>
      </div>
    </div>
  );
};

export default HeatmapLegend;
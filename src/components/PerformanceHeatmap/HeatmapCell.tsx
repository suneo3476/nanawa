// src/components/PerformanceHeatmap/HeatmapCell.tsx

import React from 'react';
import { PeriodData } from './utils/HeatmapUtils';
import { getBackgroundColor, getTextColor, getDotsDisplayInfo } from './utils/HeatmapUtils';

interface HeatmapCellProps {
  periodData: PeriodData;
  songTitle: string;
  onClick: () => void;
}

const HeatmapCell: React.FC<HeatmapCellProps> = ({ periodData, songTitle, onClick }) => {
  const { period, count, intensity, isBeforeRelease } = periodData;
  
  return (
    <td 
      className={`py-2 px-1 border-b border-gray-200 text-center ${count > 0 ? 'hover:transform hover:scale-110 cursor-pointer transition-all' : ''}`}
      style={{ 
        backgroundColor: getBackgroundColor(intensity, isBeforeRelease),
        color: getTextColor(intensity, isBeforeRelease),
        width: '60px',
        minWidth: '60px',
      }}
      title={`${songTitle} - ${period}: ${count}回演奏 ${isBeforeRelease ? '(リリース前)' : ''}`}
      onClick={() => count > 0 && onClick()}
    >
      {count > 0 ? (
        <div className="flex flex-col items-center">
          {(() => {
            const dotsInfo = getDotsDisplayInfo(count, isBeforeRelease);
            if (!dotsInfo) return null;
            
            if (dotsInfo.singleRow) {
              return (
                <div className="flex justify-center gap-1">
                  {Array(dotsInfo.displayCount).fill(0).map((_, i) => (
                    <span key={i} className={dotsInfo.dotColor}>●</span>
                  ))}
                </div>
              );
            } else {
              return (
                <div>
                  <div className="flex justify-center gap-1">
                    {Array(dotsInfo.topRowCount).fill(0).map((_, i) => (
                      <span key={`top-${i}`} className={dotsInfo.dotColor}>●</span>
                    ))}
                  </div>
                  <div className="flex justify-center gap-1 mt-1">
                    {Array(dotsInfo.bottomRowCount).fill(0).map((_, i) => (
                      <span key={`bottom-${i}`} className={dotsInfo.dotColor}>●</span>
                    ))}
                  </div>
                </div>
              );
            }
          })()}
          <div className="text-xs opacity-80 mt-0.5">({count})</div>
        </div>
      ) : ''}
    </td>
  );
};

export default HeatmapCell;
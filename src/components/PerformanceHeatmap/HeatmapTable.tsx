// src/components/PerformanceHeatmap/HeatmapTable.tsx

import React from 'react';
import { useRouter } from 'next/navigation';
import { Maximize, Minimize } from 'lucide-react';
import HeatmapCell from './HeatmapCell';
import { SongHeatmapData } from './utils/HeatmapUtils';

interface HeatmapTableProps {
  heatmapData: SongHeatmapData[];
  isCompactMode: boolean;
  setIsCompactMode: (isCompact: boolean) => void;
  onCellClick: (songId: string, period: string) => void;
  containerHeight: string;
}

const HeatmapTable: React.FC<HeatmapTableProps> = ({
  heatmapData,
  isCompactMode,
  setIsCompactMode,
  onCellClick,
  containerHeight
}) => {
  const router = useRouter();

  // データがない場合のメッセージ
  if (heatmapData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        表示するデータがありません
      </div>
    );
  }

  return (
    <div 
      className="overflow-auto heatmap-container flex-grow px-1"
      style={{ height: containerHeight }}
    >
      <table className="min-w-full border-collapse heatmap-table">
        <thead>
          <tr>
            <th 
              style={{ 
                position: 'sticky', 
                top: 0, 
                left: 0, 
                zIndex: 30,
                backgroundColor: '#f9fafb',
                minWidth: isCompactMode ? '50px' : '110px',
                width: isCompactMode ? '50px' : '110px',
              }}
              className="py-2 px-2 border-b border-r border-gray-200 font-medium text-gray-700 whitespace-nowrap"
            >
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCompactMode(!isCompactMode);
                  }}
                  className="text-gray-400 hover:text-purple-600 rounded-full p-1 hover:bg-purple-50"
                  title={isCompactMode ? "詳細表示に切り替え" : "コンパクト表示に切り替え"}
                >
                  {isCompactMode ? (
                    <Maximize size={16} />
                  ) : (
                    <Minimize size={16} />
                  )}
                </button>
                {!isCompactMode && (
                  <span className="md:hidden">曲情報</span>
                )}
                <span className="hidden md:inline">演奏回数</span>
              </div>
            </th>
            <th 
              style={{ 
                position: 'sticky', 
                top: 0, 
                left: '110px', 
                zIndex: 30,
                backgroundColor: '#f9fafb',
                minWidth: '180px',
              }}
              className="text-left py-2 px-4 border-b border-r border-gray-200 font-medium text-gray-700 hidden md:table-cell"
            >
              曲名
            </th>
            {heatmapData.length > 0 && heatmapData[0].periods.map((period, index) => (
              <th 
                key={index}
                style={{ 
                  position: 'sticky', 
                  top: 0, 
                  zIndex: 20,
                  backgroundColor: '#f9fafb',
                  width: '60px',
                  minWidth: '60px',
                }}
                className="py-2 px-1 border-b border-gray-200 font-medium text-gray-700 text-center whitespace-nowrap"
              >
                {period.period}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {heatmapData.map((row, rowIndex) => (
            <tr key={row.song.id} className={rowIndex % 2 === 0 ? '' : 'bg-gray-50'}>
              <td 
                style={{ 
                  position: 'sticky', 
                  left: 0, 
                  zIndex: 10,
                  backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f9fafb',
                  width: isCompactMode ? '50px' : '110px',
                  minWidth: isCompactMode ? '50px' : '110px',
                  textAlign: isCompactMode ? 'center' : 'left',
                }}
                className="py-2 px-1 border-b border-r border-gray-200"
              >
                <div 
                  className="cursor-pointer"
                  onClick={() => router.push(`/songs/${row.song.id}`)}
                >
                  {isCompactMode ? (
                    // コンパクトモード - 曲名のみを縦書きで表示
                    <div className="vertical-text text-xs text-purple-800 font-medium h-24 w-full flex items-center justify-center text-center">
                      {row.song.title}
                    </div>
                  ) : (
                    // 通常モード
                    <>
                      {/* モバイル表示時は情報を縦に並べてコンパクトに */}
                      <div className="md:hidden space-y-1">
                        <div className="flex justify-center">
                          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {row.totalCount}回
                          </span>
                        </div>
                        <div className="font-medium text-purple-800 text-center truncate text-sm">{row.song.title}</div>
                        {row.releaseYear && (
                          <div className="text-xs text-gray-600 text-center">{row.releaseYear}</div>
                        )}
                        {row.song.album && (
                          <div className="text-xs text-gray-500 text-center truncate">
                            {row.song.album}
                          </div>
                        )}
                      </div>
                      
                      {/* デスクトップ表示時は演奏回数のみ */}
                      <div className="hidden md:flex md:justify-center">
                        <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full">
                          {row.totalCount}回
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </td>
              <td 
                style={{ 
                  position: 'sticky', 
                  left: '110px', 
                  zIndex: 10,
                  backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f9fafb',
                  minWidth: '180px',
                }}
                className="py-4 px-4 border-b border-r border-gray-200 font-medium text-gray-900 cursor-pointer hover:text-purple-700 hidden md:table-cell"
                onClick={() => router.push(`/songs/${row.song.id}`)}
              >
                <div className="max-w-xs">
                  {/* 曲名 */}
                  <div className="font-medium truncate text-purple-800">
                    {row.song.title}
                  </div>
                  
                  {/* 初リリース年 */}
                  {row.releaseYear && (
                    <div className="text-xs text-gray-600">
                      {row.releaseYear}
                    </div>
                  )}
                  
                  {/* 初リリース時のディスコグラフィ名とカテゴリ */}
                  {row.song.album && (
                    <div className="text-xs text-gray-500 truncate">
                      {row.song.album}
                      {row.song.firstRelease?.category && (
                        <span className="text-gray-400">
                          （{row.song.firstRelease.category}）
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </td>
              {row.periods.map((period, index) => (
                <HeatmapCell
                  key={index}
                  periodData={period}
                  songTitle={row.song.title}
                  onClick={() => onCellClick(row.song.id, period.period)}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HeatmapTable;
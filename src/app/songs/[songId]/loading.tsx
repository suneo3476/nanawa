// src/app/songs/[songId]/loading.tsx

import { Music, Calendar, Disc, BarChart2, BarChart } from 'lucide-react';

export default function SongLoading() {
  return (
    <div className="space-y-8">
      {/* 楽曲情報ヘッダーのスケルトン */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
          
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Disc size={18} className="text-gray-300" />
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            <div className="space-y-3 ml-6">
              {/* アルバム情報のスケルトン */}
              <div>
                <div className="text-sm text-gray-300">収録アルバム</div>
                <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mt-1"></div>
              </div>
              
              {/* リリース日のスケルトン */}
              <div>
                <div className="text-sm text-gray-300">リリース日</div>
                <div className="h-6 w-36 bg-gray-200 rounded animate-pulse mt-1"></div>
              </div>
              
              {/* リリースタイプのスケルトン */}
              <div>
                <div className="text-sm text-gray-300">リリースタイプ</div>
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
              </div>
              
              {/* 収録作品のスケルトン */}
              <div>
                <div className="text-sm text-gray-300">全収録作品</div>
                <div className="space-y-1 mt-1">
                  {[1, 2, 3].map((_, index) => (
                    <div key={index} className="h-6 w-full bg-gray-200 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart size={18} className="text-gray-300" />
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            <div className="space-y-3 ml-6">
              {/* 初演奏のスケルトン */}
              <div>
                <div className="text-sm text-gray-300">初演奏</div>
                <div className="h-6 w-full bg-gray-200 rounded animate-pulse mt-1"></div>
              </div>
              
              {/* 最終演奏のスケルトン */}
              <div>
                <div className="text-sm text-gray-300">最終演奏</div>
                <div className="h-6 w-full bg-gray-200 rounded animate-pulse mt-1"></div>
              </div>
              
              {/* 演奏頻度のスケルトン */}
              <div>
                <div className="text-sm text-gray-300">演奏頻度</div>
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 演奏回数の推移グラフのスケルトン */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={20} className="text-gray-300" />
          <div className="h-7 w-40 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="h-72 bg-gray-100 rounded animate-pulse"></div>
      </div>
      
      {/* 最近の演奏ライブのスケルトン */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-300" />
            <div className="h-7 w-40 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((_, index) => (
            <div key={index} className="bg-gray-100 rounded-xl shadow-sm animate-pulse p-6 h-52"></div>
          ))}
        </div>
      </div>
      
      {/* 戻るリンクのスケルトン */}
      <div className="flex justify-center">
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
}
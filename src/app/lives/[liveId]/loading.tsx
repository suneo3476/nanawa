// src/app/lives/[liveId]/loading.tsx

import { CalendarDays, MapPin, MessageCircle, Music } from 'lucide-react';

export default function LiveLoading() {
  return (
    <div className="space-y-8">
      {/* ライブ情報ヘッダーのスケルトン */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="h-8 w-2/3 bg-gray-200 rounded animate-pulse mb-4"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays aria-hidden="true" size={20} className="text-gray-300" />
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin aria-hidden="true" size={20} className="text-gray-300" />
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            <div className="flex items-start gap-2">
              <MessageCircle aria-hidden="true" size={20} className="text-gray-300 flex-shrink-0 mt-1" />
              <div className="h-16 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          
          {/* ナビゲーションリンクのスケルトン */}
          <div className="flex flex-col gap-3 justify-end">
            <div className="flex items-center justify-between gap-2">
              <div className="h-12 w-40 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 w-40 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* セットリストのスケルトン */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-6"></div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Music size={16} className="text-gray-300" />
            <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
          
          {/* セットリストアイテムのスケルトン */}
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mt-2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 戻るリンクのスケルトン */}
      <div className="flex justify-center">
        <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
}
'use client';

import Link from 'next/link';
import { List, Calendar } from 'lucide-react';

interface ViewToggleProps {
  currentView: string;
}

/**
 * ライブ表示モードの切り替えボタン
 * リスト表示とタイムライン表示を切り替える
 */
export default function ViewToggle({ currentView }: ViewToggleProps) {
  return (
    <div className="flex justify-end mb-4">
      <div className="bg-white rounded-lg shadow-sm p-1 flex">
        <Link href="?view=list" 
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            currentView === 'list' 
              ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <List size={18} />
          <span className="font-medium">リスト表示</span>
        </Link>
        
        <Link href="?view=timeline" 
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            currentView === 'timeline' 
              ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Calendar size={18} />
          <span className="font-medium">タイムライン表示</span>
        </Link>
      </div>
    </div>
  );
}
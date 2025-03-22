// src/app/page.tsx

import Link from 'next/link';
import { CalendarDays, Clock, Search, Music, BarChart2 } from 'lucide-react';

export default function Home() {
  // メインナビゲーションのリンク定義
  const mainLinks = [
    {
      id: 'search',
      title: 'ライブとセトリ',
      description: 'ライブの検索とセットリストの閲覧',
      icon: <Search className="h-8 w-8 text-purple-500" />,
      href: '/search',
      color: 'bg-purple-50 hover:bg-purple-100'
    },
    {
      id: 'stats',
      title: 'アクティビティ',
      description: '演奏統計と活動データの分析',
      icon: <BarChart2 className="h-8 w-8 text-pink-500" />,
      href: '/stats',
      color: 'bg-pink-50 hover:bg-pink-100'
    },
    {
      id: 'heatmap',
      title: 'ヒートマップ',
      description: '期間別の楽曲演奏頻度の可視化',
      icon: <Music className="h-8 w-8 text-indigo-500" />,
      href: '/heatmap',
      color: 'bg-indigo-50 hover:bg-indigo-100'
    }
  ];

  // 最近の更新やお知らせの定義
  const updates = [
    {
      id: 'update1',
      date: '2025-03-22',
      title: 'データモデルの改善',
      description: 'YAML形式への移行と型定義の拡張が完了しました。'
    },
    {
      id: 'update2',
      date: '2025-03-20',
      title: 'AWS Amplifyでのホスティング',
      description: 'SSG生成モードによる静的サイトのデプロイを実装しました。'
    },
    {
      id: 'update3',
      date: '2025-03-15',
      title: 'すべてのライブデータを更新',
      description: '最新のライブ情報とセットリストを追加しました。'
    }
  ];

  return (
    <div className="space-y-8">
      {/* ヒーローセクション */}
      <div className="relative bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('/pattern.svg')] bg-center"></div>
        <div className="relative px-8 py-14 sm:px-12 sm:py-20 text-white">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">七輪アーカイブ</h1>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl">
            aikoコピーバンド「七輪」の活動記録。2003年から現在までの演奏ライブ、セットリスト、統計データを検索・閲覧できます。
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link
              href="/search"
              className="px-6 py-3 bg-white text-purple-700 rounded-full font-medium hover:bg-purple-50 transition-colors shadow-sm flex items-center gap-2"
            >
              <Search size={18} />
              ライブとセトリを見る
            </Link>
            <Link
              href="/stats"
              className="px-6 py-3 bg-purple-500 bg-opacity-20 text-white rounded-full font-medium border border-purple-300 border-opacity-30 hover:bg-opacity-30 transition-colors flex items-center gap-2"
            >
              <BarChart2 size={18} />
              統計を見る
            </Link>
          </div>
        </div>
      </div>

      {/* メインナビゲーション */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mainLinks.map((link) => (
          <Link 
            key={link.id}
            href={link.href} 
            className={`p-6 rounded-xl shadow-sm hover:shadow transition-all ${link.color}`}
          >
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-white p-3 shadow-sm">
                {link.icon}
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-1">{link.title}</h2>
                <p className="text-gray-600">{link.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 最近の更新セクション */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Clock className="text-purple-500" size={20} />
          最近の更新
        </h2>
        
        <div className="divide-y divide-gray-100">
          {updates.map((update) => (
            <div key={update.id} className="py-4">
              <div className="flex items-start gap-3">
                <div className="bg-purple-100 text-purple-600 rounded-full px-2 py-1 text-xs font-medium flex items-center gap-1">
                  <CalendarDays size={12} />
                  {update.date}
                </div>
                <div>
                  <h3 className="font-medium">{update.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{update.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
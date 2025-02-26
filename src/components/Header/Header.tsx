'use client';

import React from 'react';
import Link from 'next/link';

export const Header = () => (
  <header className="bg-gradient-to-r from-purple-500 to-orange-400 text-white" role="banner">
    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold">
        <Link href="/" className="hover:opacity-90 transition-opacity">七輪</Link>
      </h1>
      <nav aria-label="メインナビゲーション">
        <ul className="flex space-x-4">
          <li>
            <Link 
              href="/lives" 
              className="hover:bg-white/20 px-3 py-1 rounded-full text-sm transition-colors inline-block"
            >
              ライブ一覧
            </Link>
          </li>
          <li>
            <Link 
              href="/songs" 
              className="hover:bg-white/20 px-3 py-1 rounded-full text-sm transition-colors inline-block"
            >
              楽曲一覧
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  </header>
);

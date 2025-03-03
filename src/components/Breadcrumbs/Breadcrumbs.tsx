// components/Breadcrumbs/Breadcrumbs.tsx
'use client';

import { Suspense } from 'react';
import BreadcrumbsContent from './BreadcrumbsContent';

/**
 * パンくずリストのラッパーコンポーネント
 * SuspenseでラップしてuseSearchParamsとusePathnameを安全に使用できるようにする
 */
export default function Breadcrumbs() {
  return (
    <Suspense fallback={
      <div className="breadcrumbs-placeholder h-10 py-2 px-4 bg-gray-100 rounded-md mb-4 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-48"></div>
      </div>
    }>
      <BreadcrumbsContent />
    </Suspense>
  );
}
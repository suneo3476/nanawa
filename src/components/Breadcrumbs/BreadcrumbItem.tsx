// src/components/Breadcrumbs/BreadcrumbItem.tsx

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { BreadcrumbItem as BreadcrumbItemType } from './types/BreadcrumbsTypes';
import { formatDisplayLabel } from './utils/BreadcrumbsUtils';

interface BreadcrumbItemProps {
  item: BreadcrumbItemType;
  isLast: boolean;
  showDivider: boolean;
}

/**
 * パンくずリストの個々のアイテムを表示するコンポーネント
 */
export const BreadcrumbItem: React.FC<BreadcrumbItemProps> = ({ 
  item, 
  isLast, 
  showDivider 
}) => {
  return (
    <React.Fragment>
      {/* 区切り記号（必要な場合のみ表示） */}
      {showDivider && (
        <li className="flex items-center text-gray-400">
          <ChevronRight size={14} />
        </li>
      )}
      
      <li>
        {isLast ? (
          // 現在のページ（最後の要素）
          <span className="font-medium text-gray-800" aria-current="page">
            {formatDisplayLabel(item)}
          </span>
        ) : (
          // 過去のページ（クリック可能なリンク）
          <Link
            href={item.path}
            className="text-purple-600 hover:text-purple-800 hover:underline"
          >
            {formatDisplayLabel(item)}
          </Link>
        )}
      </li>
    </React.Fragment>
  );
};
'use client';

import { useSearchParams } from 'next/navigation';

export default function ClientSidePath() {
  const searchParams = useSearchParams();
  const fromPath = searchParams.get('from') || '';
  
  if (!fromPath) return null;
  
  return (
    <p className="text-sm text-gray-500 mb-4">
      リクエストされたパス: {fromPath}
    </p>
  );
}
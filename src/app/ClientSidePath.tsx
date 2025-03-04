// src/app/ClientSidePath.tsx
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ClientSidePathContent() {
  const searchParams = useSearchParams();
  const fromPath = searchParams.get('from') || '';
  
  if (!fromPath) return null;
  
  return (
    <p className="text-sm text-gray-500 mb-4">
      リクエストされたパス: {fromPath}
    </p>
  );
}

export default function ClientSidePath() {
  return (
    <Suspense fallback={<div>Loading path...</div>}>
      <ClientSidePathContent />
    </Suspense>
  );
}
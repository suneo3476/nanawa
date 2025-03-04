import { Suspense } from 'react';
import { Header } from '@/components/Header/Header';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SettingsProvider } from '@/components/Settings';

export const metadata = {
  title: '七輪',
  description: 'aikoコピーバンド「七輪」の活動記録',
};

// カスタムローディングコンポーネント
function CustomLoading() {
  return <div className="p-4 text-center">Loading...</div>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full">
      <body className="h-full bg-gray-50">
        <SettingsProvider>
          <Header />
          <main className="container mx-auto px-4 py-8">
            {/* ネストされたSuspenseを使用してより確実に対応 */}
            <Suspense fallback={<CustomLoading />}>
              <Breadcrumbs />
              <Suspense fallback={<CustomLoading />}>
                {children}
              </Suspense>
            </Suspense>
          </main>
        </SettingsProvider>
      </body>
    </html>
  );
}
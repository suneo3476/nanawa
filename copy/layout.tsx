// src/app/layout.tsx

import './globals.css';

import { Header } from '@/components/Header/Header';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { SettingsProvider } from '@/components/Settings';

export const metadata = {
  title: '七輪',
  description: 'aikoコピーバンド「七輪」の活動記録',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className="h-full mdl-js">
      <body className="h-full bg-gray-50 vsc-initialized">
        <SettingsProvider>
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Breadcrumbs />
            {children}
          </main>
        </SettingsProvider>
      </body>
    </html>
  );
}
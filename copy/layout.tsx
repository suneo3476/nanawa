import './globals.css';

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
        {children}
      </body>
    </html>
  );
}

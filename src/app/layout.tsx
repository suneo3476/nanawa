import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { buildSearchIndex } from "@/lib/search-index";

const notoSansJp = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "七輪ライブラリー",
    template: "%s | 七輪ライブラリー",
  },
  description:
    "aikoコピーバンド「七輪」の20年を超えるライブ出演記録とセットリストのアーカイブ。曲名・会場・年からライブ履歴を検索できます。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const searchIndex = buildSearchIndex();
  return (
    <html lang="ja" className={`${notoSansJp.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Header searchIndex={searchIndex} />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-16 sm:px-6">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { getAllLives, getSummary } from "@/lib/data";
import { LivesBrowser } from "@/components/LivesBrowser";

export const metadata: Metadata = {
  description:
    "aikoコピーバンド「七輪」のライブ出演履歴。曲名・会場・年・イベント名でその場で絞り込めます。",
};

export default function HomePage() {
  const lives = getAllLives();
  const summary = getSummary();

  return (
    <div className="pt-8">
      <section className="pb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">ライブ履歴</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          {summary.years[0]}年からの全{summary.liveCount}
          回の出演記録とセットリスト。「この曲やった?いつ?どこで?」は、下の検索ボックスに曲名を入れると答えが出ます。
        </p>
      </section>
      <LivesBrowser lives={lives} years={summary.years} />
    </div>
  );
}

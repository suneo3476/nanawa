import type { Metadata } from "next";
import { getAllLives, getSummary } from "@/lib/data";
import { LivesBrowser } from "@/components/LivesBrowser";
import { InfoTip } from "@/components/InfoTip";

export const metadata: Metadata = {
  description:
    "aikoコピーバンド「七輪」のライブ出演履歴。曲名・会場・年・イベント名でその場で絞り込めます。",
};

export default function HomePage() {
  const lives = getAllLives();
  const summary = getSummary();

  return (
    <div className="pt-8">
      <header className="flex items-center gap-2.5 pb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">ライブ履歴</h1>
        <span className="text-sm text-muted">
          {summary.years[0]}年〜 全{summary.liveCount}回
        </span>
        <InfoTip>
          「この曲やった?いつ?どこで?」は検索ボックスに曲名を入れると答えが出ます。イベント名・会場名・年でも絞り込めて、ひらがな・カタカナはどちらでも構いません。
        </InfoTip>
      </header>
      <LivesBrowser lives={lives} years={summary.years} />
    </div>
  );
}

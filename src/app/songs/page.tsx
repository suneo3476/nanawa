import type { Metadata } from "next";
import { getAllSongs, getSummary } from "@/lib/data";
import { SongsBrowser, type SongSummary } from "@/components/SongsBrowser";
import { InfoTip } from "@/components/InfoTip";

export const metadata: Metadata = {
  title: "楽曲",
  description:
    "七輪がこれまでに演奏した全楽曲。演奏回数・初披露・最終演奏で並べ替えて探せます。",
};

export default function SongsPage() {
  const summary = getSummary();
  const songs: SongSummary[] = getAllSongs()
    .filter((s) => s.playCount > 0)
    .map((s) => ({
      id: s.id,
      title: s.title,
      album: s.album,
      releaseDate: s.releaseDate,
      isSingle: s.isSingle,
      playCount: s.playCount,
      firstDate: s.firstPerformance?.date ?? "",
      lastDate: s.lastPerformance?.date ?? "",
      yearCounts: s.yearCounts,
      youtubeCount: s.youtubeCount,
    }));

  return (
    <div className="pt-8">
      <header className="flex items-center gap-2.5 pb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">楽曲</h1>
        <span className="text-sm text-muted">演奏歴あり {songs.length}曲</span>
        <InfoTip>
          これまでにライブで演奏した曲の一覧です。曲名・アルバム名で検索でき、演奏回数・最近やった順・ごぶさた順で並べ替えられます。棒グラフは年ごとの演奏回数です。
        </InfoTip>
      </header>
      <SongsBrowser songs={songs} years={summary.years} />
    </div>
  );
}

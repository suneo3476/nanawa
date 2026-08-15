import type { Metadata } from "next";
import { getAllSongs, getSummary } from "@/lib/data";
import { SongsBrowser, type SongSummary } from "@/components/SongsBrowser";

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
      <section className="pb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">楽曲</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          これまでにライブで演奏した{songs.length}
          曲。曲名で検索、演奏回数や「最後にやった日」で並べ替えできます。
        </p>
      </section>
      <SongsBrowser songs={songs} years={summary.years} />
    </div>
  );
}

import type { Metadata } from "next";
import { getAllLives, getAllSongs } from "@/lib/data";
import { SetlistPlanner, type PickerSong } from "@/components/SetlistPlanner";

export const metadata: Metadata = {
  title: "選曲ノート",
  description:
    "選曲会議のたたき台。未演奏曲も含む全ディスコグラフィから、演奏履歴とセトリの方向性を見ながら候補リストを組めます。",
};

export default function PickerPage() {
  const lives = getAllLives();
  const songs: PickerSong[] = getAllSongs().map((s) => ({
    id: s.id,
    title: s.title,
    albums: s.appearsOn.map((a) => a.albumTitle),
    releaseDate: s.releaseDate,
    playCount: s.playCount,
    performed: s.playCount > 0,
    lastDate: s.lastPerformance?.date ?? "",
    livesSinceLast: s.lastPerformance
      ? lives.filter((l) => l.date > s.lastPerformance!.date).length
      : null,
    youtubeCount: s.youtubeCount,
    tempo: s.tempo,
    ballad: s.ballad,
  }));

  return (
    <div className="pt-8">
      <section className="pb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">選曲ノート</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          「今まで何やったっけ?」を見ながら次のライブの候補を組むたたき台。
          <strong className="font-semibold">
            未演奏曲も含む全ディスコグラフィ{songs.length}曲
          </strong>
          から選べます。セトリの方向性を決めると、構成の適合度と「次に足すといい曲」が分かります。候補リストはこの端末に自動保存され、リンクやテキストでメンバーへ共有できます。
        </p>
      </section>
      <SetlistPlanner songs={songs} />
    </div>
  );
}

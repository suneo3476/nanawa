import type { Metadata } from "next";
import { getAllLives, getAllSongs } from "@/lib/data";
import { SetlistPlanner, type PickerSong } from "@/components/SetlistPlanner";

export const metadata: Metadata = {
  title: "選曲ノート",
  description:
    "選曲会議のたたき台。演奏履歴を見ながら候補リストを作って、リンクやテキストでメンバーに共有できます。",
};

export default function PickerPage() {
  const lives = getAllLives();
  const songs: PickerSong[] = getAllSongs()
    .filter((s) => s.playCount > 0)
    .map((s) => ({
      id: s.id,
      title: s.title,
      album: s.album,
      releaseDate: s.releaseDate,
      playCount: s.playCount,
      lastDate: s.lastPerformance?.date ?? "",
      lastEventName: s.lastPerformance?.eventName ?? "",
      livesSinceLast: s.lastPerformance
        ? lives.filter((l) => l.date > s.lastPerformance!.date).length
        : 0,
      youtubeCount: s.youtubeCount,
    }));

  return (
    <div className="pt-8">
      <section className="pb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">選曲ノート</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          「今まで何やったっけ?」を見ながら次のライブの候補を組むたたき台。候補リストはこの端末に自動保存され、リンクやテキストにしてメンバーへ共有できます。試聴ボタンでiTunesの30秒プレビューがその場で聞けます(SpotifyやYouTube
          Musicで開けば、ログイン済みならフル再生)。
        </p>
      </section>
      <SetlistPlanner songs={songs} />
    </div>
  );
}

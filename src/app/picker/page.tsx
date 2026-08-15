import type { Metadata } from "next";
import { getAllLives, getAllSongs } from "@/lib/data";
import { SetlistPlanner, type PickerSong } from "@/components/SetlistPlanner";
import { InfoTip } from "@/components/InfoTip";

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
    fameTier: s.fameTier,
    mediaUse: s.mediaUse,
  }));

  return (
    <div className="pt-8">
      <header className="flex items-center gap-2.5 pb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">選曲ノート</h1>
        <InfoTip>
          次のライブの候補を組むたたき台です。未演奏曲も含む全ディスコグラフィ
          {songs.length}
          曲から「曲を追加」で選べます。セトリの方向性(テンポ・知名度)を決めると、構成の適合度と「次に足すといい曲」(おすすめ順)が分かります。候補リストはこの端末に自動保存され、リンクやテキストでメンバーへ共有できます。試聴はiTunesの30秒プレビュー、SpotifyやYouTube
          Musicはログイン済みならフル再生できます。
        </InfoTip>
      </header>
      <SetlistPlanner songs={songs} />
    </div>
  );
}

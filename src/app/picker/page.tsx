import type { Metadata } from "next";
import { getAllAlbums, getAllLives, getAllSongs } from "@/lib/data";
import { SetlistPlanner } from "@/components/picker/SetlistPlanner";
import type { PickerAlbum, PickerSong } from "@/components/picker/types";
import { InfoTip } from "@/components/InfoTip";

export const metadata: Metadata = {
  title: "選曲ノート",
  description:
    "選曲会議のたたき台。未演奏曲も含む全ディスコグラフィから、演奏履歴・テンポ・知名度・季節・メンバーの希望曲を見ながらセトリを組めます。",
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
    tempo: s.tempo,
    ballad: s.ballad,
    bpm: s.bpm,
    isSingleA: s.isSingleA,
    isCoupling: s.isCoupling,
    kouhaku: s.kouhaku,
    tieup: s.tieup,
    seasons: s.seasons,
    fameTier: s.fameTier,
  }));

  const albums: PickerAlbum[] = getAllAlbums().map((a) => ({
    id: a.id,
    title: a.title,
    category: a.category,
    subCategory: a.subCategory,
    releaseDate: a.releaseDate,
    songIds: a.tracks.map((t) => t.songId),
  }));

  // セトリを書き出すときに使う次のID
  const nextLiveNumber =
    Math.max(0, ...lives.map((l) => Number(l.id.replace("live", "")))) + 1;
  const nextEventId = Math.max(0, ...lives.map((l) => l.eventId)) + 1;

  return (
    <div className="pt-8">
      <header className="flex flex-wrap items-center gap-2.5 pb-5">
        <h1 className="text-2xl font-bold sm:text-3xl">選曲ノート</h1>
        <span className="text-sm text-muted">全{songs.length}曲から</span>
        <InfoTip>
          次のライブのセトリを組むためのノートです。未演奏曲を含む全ディスコグラフィから選べます。
          セトリの方向性(テンポ・知名度)を表から選ぶと候補リストの適合度が出ます。メンバーごとの希望曲を登録すると、全員の希望が1曲以上入っているかを確認できます。
          できたセトリはライブ記録用のデータとして書き出せます。内容はこの端末に自動保存され、リンクやテキストで共有できます。
        </InfoTip>
      </header>
      <SetlistPlanner
        songs={songs}
        albums={albums}
        nextLiveNumber={nextLiveNumber}
        nextEventId={nextEventId}
      />
    </div>
  );
}

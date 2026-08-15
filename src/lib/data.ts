import fs from "node:fs";
import path from "node:path";
import { load as yamlLoad } from "js-yaml";
import type {
  Album,
  AlbumTrack,
  ArchiveSummary,
  Live,
  LiveDetail,
  SetlistEntry,
  SetlistItem,
  Song,
  SongDetail,
  SongPerformance,
  Tempo,
  Venue,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

function loadYaml<T>(name: string): T[] {
  const raw = fs.readFileSync(path.join(DATA_DIR, `${name}.yml`), "utf8");
  const parsed = yamlLoad(raw);
  if (!Array.isArray(parsed)) {
    throw new Error(`data/${name}.yml: 配列ではありません`);
  }
  return parsed as T[];
}

function fail(msg: string): never {
  throw new Error(`データ検証エラー: ${msg}`);
}

interface SongAttr {
  tempo: Tempo | null;
  ballad: boolean | null;
}

interface Dataset {
  songs: Song[];
  attrsBySong: Map<string, SongAttr>;
  lives: Live[];
  setlists: SetlistItem[];
  albums: Album[];
  albumTracks: AlbumTrack[];
  songById: Map<string, Song>;
  liveById: Map<string, Live>;
  /** 日付昇順のライブ */
  livesAsc: Live[];
  setlistByLive: Map<string, SetlistItem[]>;
  /** songId -> 日付昇順の演奏 (live, item) */
  performancesBySong: Map<string, { live: Live; item: SetlistItem }[]>;
  /** songId -> 初披露の liveId */
  firstLiveBySong: Map<string, string>;
}

let cache: Dataset | null = null;

function toStr(v: unknown): string {
  return v == null ? "" : String(v);
}

function loadDataset(): Dataset {
  if (cache) return cache;

  const songs: Song[] = loadYaml<Record<string, unknown>>("songs").map((s) => ({
    id: toStr(s.id),
    title: toStr(s.title),
    album: toStr(s.album),
    releaseDate: toStr(s.releaseDate),
    trackNumber:
      s.trackNumber === "" || s.trackNumber == null
        ? null
        : Number(s.trackNumber),
    isSingle: s.isSingle === true || s.isSingle === "true",
  }));

  const lives: Live[] = loadYaml<Record<string, unknown>>("lives").map((l) => ({
    id: toStr(l.id),
    eventId: Number(l.eventId),
    date: toStr(l.date),
    eventName: toStr(l.eventName),
    venueName: toStr(l.venueName),
    memo: toStr(l.memo),
  }));

  const setlists: SetlistItem[] = loadYaml<Record<string, unknown>>(
    "setlists",
  ).map((s) => ({
    liveId: toStr(s.liveId),
    songId: toStr(s.songId),
    order: Number(s.order),
    type: toStr(s.type) === "medley" ? "medley" : "individual",
    memo: toStr(s.memo),
    youtubeUrl: toStr(s.youtubeUrl),
  }));

  const albums: Album[] = loadYaml<Record<string, unknown>>("albums").map(
    (a) => ({
      id: toStr(a.id),
      title: toStr(a.title),
      category: toStr(a.category),
      subCategory: toStr(a.subCategory),
      releaseDate: toStr(a.releaseDate),
    }),
  );

  const albumTracks: AlbumTrack[] = loadYaml<Record<string, unknown>>(
    "album_tracks",
  ).map((t) => ({
    albumId: toStr(t.albumId),
    songId: toStr(t.songId),
    trackNumber: Number(t.trackNumber),
  }));

  const attrsBySong = new Map<string, SongAttr>(
    loadYaml<Record<string, unknown>>("song_attributes").map((a) => [
      toStr(a.songId),
      {
        tempo: ["up", "mid", "slow"].includes(toStr(a.tempo))
          ? (toStr(a.tempo) as Tempo)
          : null,
        ballad: a.ballad === true || a.ballad === "true",
      },
    ]),
  );

  // ---- 検証 ----
  const songById = new Map(songs.map((s) => [s.id, s]));
  const liveById = new Map(lives.map((l) => [l.id, l]));
  const albumById = new Map(albums.map((a) => [a.id, a]));

  if (songById.size !== songs.length) fail("songs.yml に重複IDがあります");
  if (liveById.size !== lives.length) fail("lives.yml に重複IDがあります");
  for (const l of lives) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(l.date)) {
      fail(`${l.id} の日付が YYYY-MM-DD 形式ではありません: "${l.date}"`);
    }
  }
  for (const s of setlists) {
    if (!liveById.has(s.liveId)) fail(`setlists.yml: 不明な liveId ${s.liveId}`);
    if (!songById.has(s.songId)) fail(`setlists.yml: 不明な songId ${s.songId}`);
  }
  for (const t of albumTracks) {
    if (!albumById.has(t.albumId))
      fail(`album_tracks.yml: 不明な albumId ${t.albumId}`);
    if (!songById.has(t.songId))
      fail(`album_tracks.yml: 不明な songId ${t.songId}`);
  }
  for (const songId of attrsBySong.keys()) {
    if (!songById.has(songId))
      fail(`song_attributes.yml: 不明な songId ${songId}`);
  }

  const livesAsc = [...lives].sort(
    (a, b) => a.date.localeCompare(b.date) || a.eventId - b.eventId,
  );

  const setlistByLive = new Map<string, SetlistItem[]>();
  for (const item of setlists) {
    const arr = setlistByLive.get(item.liveId) ?? [];
    arr.push(item);
    setlistByLive.set(item.liveId, arr);
  }
  for (const arr of setlistByLive.values()) {
    arr.sort((a, b) => a.order - b.order);
  }

  const performancesBySong = new Map<
    string,
    { live: Live; item: SetlistItem }[]
  >();
  for (const live of livesAsc) {
    for (const item of setlistByLive.get(live.id) ?? []) {
      const arr = performancesBySong.get(item.songId) ?? [];
      arr.push({ live, item });
      performancesBySong.set(item.songId, arr);
    }
  }

  const firstLiveBySong = new Map<string, string>();
  for (const [songId, perfs] of performancesBySong) {
    firstLiveBySong.set(songId, perfs[0].live.id);
  }

  cache = {
    songs,
    attrsBySong,
    lives,
    setlists,
    albums,
    albumTracks,
    songById,
    liveById,
    livesAsc,
    setlistByLive,
    performancesBySong,
    firstLiveBySong,
  };
  return cache;
}

// ---- 公開API ----

// スラッグは会場名そのもの(静的出力のフォルダ名=URLデコード後のパスにするため
// エンコードしない。リンク側のエンコードは Next が行う)。"/" だけはパス区切りに
// なってしまうため全角に置き換える。
export function venueSlug(name: string): string {
  return name.replaceAll("/", "／");
}

function buildSetlistEntries(liveId: string): SetlistEntry[] {
  const d = loadDataset();
  return (d.setlistByLive.get(liveId) ?? []).map((item) => ({
    ...item,
    songTitle: d.songById.get(item.songId)?.title ?? item.songId,
    isFirstPerformance: d.firstLiveBySong.get(item.songId) === liveId,
  }));
}

export function getAllLives(): LiveDetail[] {
  const d = loadDataset();
  return d.livesAsc
    .map((live, i) => {
      const setlist = buildSetlistEntries(live.id);
      return {
        ...live,
        year: Number(live.date.slice(0, 4)),
        setlist,
        youtubeCount: setlist.filter((s) => s.youtubeUrl).length,
        prevLiveId: i > 0 ? d.livesAsc[i - 1].id : null,
        nextLiveId: i < d.livesAsc.length - 1 ? d.livesAsc[i + 1].id : null,
      };
    })
    .reverse(); // 新しい順
}

export function getLive(liveId: string): LiveDetail | null {
  return getAllLives().find((l) => l.id === liveId) ?? null;
}

function toPerformance(
  live: Live,
  item: SetlistItem,
  setlistLength: number,
): SongPerformance {
  return {
    liveId: live.id,
    date: live.date,
    eventName: live.eventName,
    venueName: live.venueName,
    order: item.order,
    setlistLength,
    type: item.type,
    memo: item.memo,
    youtubeUrl: item.youtubeUrl,
  };
}

export function getAllSongs(): SongDetail[] {
  const d = loadDataset();
  return d.songs.map((song) => {
    const perfsAsc = d.performancesBySong.get(song.id) ?? [];
    const performances = perfsAsc
      .map(({ live, item }) =>
        toPerformance(live, item, d.setlistByLive.get(live.id)?.length ?? 0),
      )
      .reverse();

    const yearCounts: Record<number, number> = {};
    for (const { live } of perfsAsc) {
      const y = Number(live.date.slice(0, 4));
      yearCounts[y] = (yearCounts[y] ?? 0) + 1;
    }

    // 同じライブで一緒に演奏された曲
    const coCounts = new Map<string, number>();
    for (const { live } of perfsAsc) {
      for (const other of d.setlistByLive.get(live.id) ?? []) {
        if (other.songId === song.id) continue;
        coCounts.set(other.songId, (coCounts.get(other.songId) ?? 0) + 1);
      }
    }
    const coPerformed = [...coCounts.entries()]
      .map(([songId, count]) => ({
        songId,
        title: d.songById.get(songId)?.title ?? songId,
        count,
      }))
      .sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, "ja"))
      .slice(0, 6);

    const appearsOn = d.albumTracks
      .filter((t) => t.songId === song.id)
      .map((t) => {
        const album = d.albums.find((a) => a.id === t.albumId)!;
        return {
          albumId: album.id,
          albumTitle: album.title,
          category: album.category,
          subCategory: album.subCategory,
          releaseDate: album.releaseDate,
          trackNumber: t.trackNumber,
        };
      })
      .sort((a, b) => a.releaseDate.localeCompare(b.releaseDate));

    const attrs = d.attrsBySong.get(song.id);
    return {
      ...song,
      tempo: attrs?.tempo ?? null,
      ballad: attrs?.ballad ?? null,
      playCount: performances.length,
      firstPerformance: performances.at(-1) ?? null,
      lastPerformance: performances[0] ?? null,
      yearCounts,
      performances,
      appearsOn,
      coPerformed,
      youtubeCount: performances.filter((p) => p.youtubeUrl).length,
    };
  });
}

export function getSong(songId: string): SongDetail | null {
  return getAllSongs().find((s) => s.id === songId) ?? null;
}

export function getAllVenues(): Venue[] {
  const d = loadDataset();
  const byName = new Map<string, Live[]>();
  for (const live of d.livesAsc) {
    if (!live.venueName) continue;
    const arr = byName.get(live.venueName) ?? [];
    arr.push(live);
    byName.set(live.venueName, arr);
  }
  return [...byName.entries()]
    .map(([name, ls]) => ({
      slug: venueSlug(name),
      name,
      liveCount: ls.length,
      liveIds: ls.map((l) => l.id),
      firstDate: ls[0].date,
      lastDate: ls.at(-1)!.date,
    }))
    .sort(
      (a, b) =>
        b.liveCount - a.liveCount || a.name.localeCompare(b.name, "ja"),
    );
}

export function getVenueBySlug(slug: string): Venue | null {
  let decoded = slug;
  try {
    decoded = decodeURIComponent(slug);
  } catch {
    // すでにデコード済みの値が来た場合はそのまま使う
  }
  return (
    getAllVenues().find((v) => v.name === decoded || v.slug === slug) ?? null
  );
}

export function getSummary(): ArchiveSummary {
  const d = loadDataset();
  const years = [
    ...new Set(d.livesAsc.map((l) => Number(l.date.slice(0, 4)))),
  ].sort((a, b) => a - b);
  return {
    liveCount: d.lives.length,
    songCount: d.songs.filter((s) => d.performancesBySong.has(s.id)).length,
    venueCount: getAllVenues().length,
    firstDate: d.livesAsc[0].date,
    lastDate: d.livesAsc.at(-1)!.date,
    youtubeCount: d.setlists.filter((s) => s.youtubeUrl).length,
    years,
  };
}

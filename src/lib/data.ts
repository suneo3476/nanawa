import fs from "node:fs";
import path from "node:path";
import { load as yamlLoad } from "js-yaml";
import type {
  Album,
  AlbumTrack,
  ArchiveSummary,
  Live,
  LiveDetail,
  Season,
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

/** 任意ファイル(まだ用意していなくてもビルドが通る) */
function loadOptionalYaml<T>(name: string): T[] {
  if (!fs.existsSync(path.join(DATA_DIR, `${name}.yml`))) return [];
  return loadYaml<T>(name);
}

function fail(msg: string): never {
  throw new Error(`データ検証エラー: ${msg}`);
}

interface SongAttr {
  tempo: Tempo | null;
  ballad: boolean | null;
  kouhaku: boolean;
  tieup: string | null;
  bpm: number | null;
}

interface Dataset {
  songs: Song[];
  attrsBySong: Map<string, SongAttr>;
  seasonsBySong: Map<string, Season[]>;
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
/** キャッシュを作ったときの data/*.yml の更新時刻。変わっていたら読み直す。 */
let cacheSignature = "";

const DATA_FILES = [
  "songs",
  "lives",
  "setlists",
  "albums",
  "album_tracks",
  "song_attributes",
  "song_seasons",
];

/**
 * data/*.yml の更新時刻をまとめた文字列。
 * 書き込みAPIやエディタでYAMLを更新したとき、開発サーバーが
 * 古いキャッシュを返し続けないようにするために使う。
 */
function dataSignature(): string {
  return DATA_FILES.map((name) => {
    const file = path.join(DATA_DIR, `${name}.yml`);
    try {
      return `${name}:${fs.statSync(file).mtimeMs}`;
    } catch {
      return `${name}:none`;
    }
  }).join("|");
}

function toStr(v: unknown): string {
  return v == null ? "" : String(v);
}

function loadDataset(): Dataset {
  const signature = dataSignature();
  if (cache && signature === cacheSignature) return cache;
  cacheSignature = signature;

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
        kouhaku: a.kouhaku === true || a.kouhaku === "true",
        tieup: toStr(a.tieup) || null,
        bpm: a.bpm != null && a.bpm !== "" ? Number(a.bpm) : null,
      },
    ]),
  );

  const VALID_SEASONS = ["spring", "summer", "autumn", "winter"];
  const seasonsBySong = new Map<string, Season[]>(
    loadOptionalYaml<Record<string, unknown>>("song_seasons").map((s) => [
      toStr(s.songId),
      (Array.isArray(s.seasons) ? s.seasons : [])
        .map(toStr)
        .filter((v): v is Season => VALID_SEASONS.includes(v)),
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
  for (const songId of seasonsBySong.keys()) {
    if (!songById.has(songId)) fail(`song_seasons.yml: 不明な songId ${songId}`);
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
    seasonsBySong,
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
  // シングル/EPの1曲目(=表題曲)に入っている曲。songs.yml の isSingle は
  // カタログ取り込み時に先勝ちで false になっていることがあるため、
  // album_tracks からも導出する。
  const albumById = new Map(d.albums.map((a) => [a.id, a]));
  const isSingleAlbum = (albumId: string) => {
    const c = albumById.get(albumId)?.category;
    return c === "シングル" || c === "EP";
  };
  const singleATracks = new Set(
    d.albumTracks
      .filter((t) => isSingleAlbum(t.albumId) && t.trackNumber === 1)
      .map((t) => t.songId),
  );
  // シングル/EPの2曲目以降に入っている曲(表題曲を除く) = カップリング
  const couplingTracks = new Set(
    d.albumTracks
      .filter((t) => isSingleAlbum(t.albumId) && t.trackNumber > 1)
      .map((t) => t.songId),
  );
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
    const kouhaku = attrs?.kouhaku ?? false;
    const tieup = attrs?.tieup ?? null;
    const isSingleA = song.isSingle || singleATracks.has(song.id);
    // カップリング判定は表題曲を優先(両方に該当する曲は表題曲として扱う)
    const isCoupling = !isSingleA && couplingTracks.has(song.id);
    return {
      ...song,
      tempo: attrs?.tempo ?? null,
      ballad: attrs?.ballad ?? null,
      kouhaku,
      tieup,
      bpm: attrs?.bpm ?? null,
      isSingleA,
      isCoupling,
      seasons: d.seasonsBySong.get(song.id) ?? [],
      // 有名度: シングル表題曲 or 紅白歌唱 → 1 / タイアップあり → 2 / それ以外 → 3
      fameTier:
        isSingleA || kouhaku
          ? (1 as const)
          : tieup
            ? (2 as const)
            : (3 as const),
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

export interface AlbumWithTracks extends Album {
  tracks: { songId: string; trackNumber: number }[];
}

/** ディスコグラフィ(リリース順)。収録曲はトラック番号順。 */
export function getAllAlbums(): AlbumWithTracks[] {
  const d = loadDataset();
  return [...d.albums]
    .sort(
      (a, b) =>
        a.releaseDate.localeCompare(b.releaseDate) ||
        a.title.localeCompare(b.title, "ja"),
    )
    .map((album) => ({
      ...album,
      tracks: d.albumTracks
        .filter((t) => t.albumId === album.id)
        .map((t) => ({ songId: t.songId, trackNumber: t.trackNumber }))
        .sort((a, b) => a.trackNumber - b.trackNumber),
    }));
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

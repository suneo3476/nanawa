// aikoの全ディスコグラフィ(data/raw/tracks.txt)を songs.yml / album_tracks.yml に
// 取り込む一回性のスクリプト。既存曲は正規化した曲名で照合し、未登録曲を追加する。
// 実行: node scripts/import-catalog.mjs
import fs from "node:fs";

const norm = (s) =>
  s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .replace(/[\s　]+/g, "")
    .replace(/[!！?？~〜･・]/g, "");

// 生データ側の表記ゆれ → songs.yml の正式表記
const ALIASES = new Map([
  [norm("イジワルな天使よ 世界を救え!"), norm("イジワルな天使よ 世界を笑え！")],
]);
const canon = (s) => ALIASES.get(norm(s)) ?? norm(s);

const read = (p) => fs.readFileSync(p, "utf8");

// ---- 既存YAMLの簡易パース(このリポジトリのフラットな形式専用) ----
function parseYaml(path) {
  const items = [];
  let cur = null;
  for (const line of read(path).split("\n")) {
    const top = line.match(/^- (\w+): (.*)$/);
    const sub = line.match(/^ {2}(\w+): (.*)$/);
    if (top) {
      cur = {};
      items.push(cur);
      cur[top[1]] = unquote(top[2]);
    } else if (sub && cur) {
      cur[sub[1]] = unquote(sub[2]);
    }
  }
  return items;
}
const unquote = (v) => {
  v = v.trim();
  return v.startsWith("'") && v.endsWith("'") ? v.slice(1, -1) : v;
};
const q = (v) => (/^[\d.]+$/.test(String(v)) || v === "" ? `'${v}'` : String(v).includes(": ") ? `'${v}'` : v);

const songs = parseYaml("data/songs.yml");
const albums = parseYaml("data/albums.yml");
const albumTracks = parseYaml("data/album_tracks.yml");

// ---- ベスト盤 aikoの詩。を必要なら追加 ----
if (!albums.some((a) => a.title === "aikoの詩。")) {
  const nextAlbumId = `album${String(albums.length + 1).padStart(3, "0")}`;
  albums.push({
    id: nextAlbumId,
    title: "aikoの詩。",
    category: "アルバム",
    subCategory: "ベスト",
    releaseDate: "2019",
  });
  fs.appendFileSync(
    "data/albums.yml",
    `- id: ${nextAlbumId}\n  title: aikoの詩。\n  category: アルバム\n  subCategory: ベスト\n  releaseDate: '2019'\n`,
  );
  console.log(`albums.yml: aikoの詩。 を ${nextAlbumId} として追加`);
}
const albumByTitle = new Map(albums.map((a) => [a.title, a]));
// tracks.txt の Disc 表記をベスト盤本体へ寄せる
const albumTitleOf = (t) => (t.startsWith("aikoの詩。") ? "aikoの詩。" : t);

// ---- tracks.txt を読む ----
const rows = read("data/raw/tracks.txt")
  .split("\n")
  .slice(1)
  .filter(Boolean)
  .map((l) => {
    const [albumTitle, songTitle, trackNo] = l.split("\t");
    return { albumTitle: albumTitleOf(albumTitle.trim()), songTitle: songTitle.trim(), trackNo: Number(trackNo) };
  });

const disco = read("data/raw/discography.txt")
  .split("\n")
  .slice(1)
  .filter(Boolean)
  .map((l) => {
    const [category, sub, title, year] = l.split("\t");
    return { category: category.trim(), sub: sub.trim(), title: title.trim(), year: year.trim() };
  });
const discoByTitle = new Map(disco.map((d) => [d.title, d]));

// ---- 曲の照合と追加 ----
const songByNorm = new Map(songs.map((s) => [canon(s.title), s]));
let nextSongNum = Math.max(...songs.map((s) => Number(s.id.replace("song", "")))) + 1;

// 曲名 → その曲が現れる行(リリース順は discography の並び順に依存)
const added = [];
for (const row of rows) {
  if (!albumByTitle.has(row.albumTitle)) {
    console.warn(`! アルバム未登録のためスキップ: ${row.albumTitle}`);
    continue;
  }
  if (songByNorm.has(canon(row.songTitle))) continue;
  const albumInfo = discoByTitle.get(row.albumTitle);
  const id = `song${String(nextSongNum++).padStart(3, "0")}`;
  const song = {
    id,
    title: row.songTitle,
    album: row.albumTitle === "aikoの詩。" ? "" : row.albumTitle,
    releaseDate: albumInfo?.year ?? "",
    trackNumber: row.trackNo,
    isSingle: albumInfo?.category === "シングル" && row.trackNo === 1,
  };
  songs.push(song);
  songByNorm.set(canon(row.songTitle), song);
  added.push(song);
}

// ---- album_tracks の補完 ----
const atKey = new Set(albumTracks.map((t) => `${t.albumId}/${t.songId}`));
const addedTracks = [];
for (const row of rows) {
  const album = albumByTitle.get(row.albumTitle);
  const song = songByNorm.get(canon(row.songTitle));
  if (!album || !song) continue;
  const key = `${album.id}/${song.id}`;
  if (atKey.has(key)) continue;
  atKey.add(key);
  addedTracks.push({ albumId: album.id, songId: song.id, trackNumber: row.trackNo });
}

// ---- 追記 ----
if (added.length) {
  fs.appendFileSync(
    "data/songs.yml",
    added
      .map(
        (s) =>
          `- id: ${s.id}\n  title: ${q(s.title)}\n  album: ${s.album ? q(s.album) : "''"}\n  releaseDate: '${s.releaseDate}'\n  trackNumber: ${s.trackNumber}\n  isSingle: ${s.isSingle}\n`,
      )
      .join(""),
  );
}
if (addedTracks.length) {
  fs.appendFileSync(
    "data/album_tracks.yml",
    addedTracks
      .map((t) => `- albumId: ${t.albumId}\n  songId: ${t.songId}\n  trackNumber: ${t.trackNumber}\n`)
      .join(""),
  );
}
console.log(`追加曲: ${added.length}曲 / album_tracks追加: ${addedTracks.length}件 / 総曲数: ${songs.length}`);
// 似た曲名の取りこぼし検出(手動レビュー用)
for (const a of added) {
  for (const s of songs) {
    if (s.id === a.id) continue;
    const x = canon(a.title), y = canon(s.title);
    if (x !== y && (x.includes(y) || y.includes(x))) {
      console.log(`? 類似曲名: 追加「${a.title}」 vs 既存「${s.title}」`);
    }
  }
}

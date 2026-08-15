// iTunes Search API (キー不要) から aiko の全曲を取得し、
// data/songs.yml のカタログと突き合わせるチェックスクリプト。
// 新譜が出たときに「取りこぼしがないか」を確認する用途。
// 実行: node scripts/check-itunes-catalog.mjs
import fs from "node:fs";

const norm = (s) =>
  s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    .replace(/[\s　]+/g, "")
    .replace(/[!！?？~〜･・]/g, "")
    // "(Live)" "- Single Ver." などの表記ゆれを除去
    .replace(/(\(.*\)|（.*）|-.*)$/g, "");

// aiko の iTunes artistId を検索
const artistRes = await fetch(
  "https://itunes.apple.com/search?term=aiko&country=JP&media=music&entity=musicArtist&limit=5",
);
const artists = (await artistRes.json()).results;
const aiko = artists.find((a) => a.artistName === "aiko");
if (!aiko) {
  console.error("aiko が見つかりませんでした");
  process.exit(1);
}
console.log(`artistId: ${aiko.artistId}`);

// アルバム一覧 → 各アルバムの曲(lookup は1回で全曲は取れないためアルバム経由)
const albumsRes = await fetch(
  `https://itunes.apple.com/lookup?id=${aiko.artistId}&entity=album&limit=200&country=JP`,
);
const albums = (await albumsRes.json()).results.filter(
  (r) => r.wrapperType === "collection",
);
console.log(`iTunes上のアルバム/シングル: ${albums.length}件`);

const itunesSongs = new Map(); // norm(title) -> {title, album}
for (const album of albums) {
  const res = await fetch(
    `https://itunes.apple.com/lookup?id=${album.collectionId}&entity=song&limit=200&country=JP`,
  );
  const tracks = (await res.json()).results.filter(
    (r) => r.wrapperType === "track" && r.artistName === "aiko",
  );
  for (const t of tracks) {
    const key = norm(t.trackName);
    if (!itunesSongs.has(key)) {
      itunesSongs.set(key, { title: t.trackName, album: album.collectionName });
    }
  }
  await new Promise((r) => setTimeout(r, 250)); // レート制限対策
}
console.log(`iTunes上のユニーク曲数: ${itunesSongs.size}`);

// ローカルカタログ
const yml = fs.readFileSync("data/songs.yml", "utf8");
const local = new Map(
  [...yml.matchAll(/title: (.+)/g)].map((m) => {
    const t = m[1].replace(/^'|'$/g, "");
    return [norm(t), t];
  }),
);
console.log(`ローカルカタログのユニーク曲数: ${local.size}`);

const missingLocal = [...itunesSongs.entries()].filter(([k]) => !local.has(k));
const missingItunes = [...local.entries()].filter(([k]) => !itunesSongs.has(k));

console.log(`\n== iTunesにあるがローカルに無い曲 (${missingLocal.length}) ==`);
for (const [, v] of missingLocal) console.log(`  ${v.title}  ←『${v.album}』`);
console.log(`\n== ローカルにあるがiTunesに無い曲 (${missingItunes.length}) ==`);
for (const [, t] of missingItunes) console.log(`  ${t}`);

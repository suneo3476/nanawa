// 曲のBPMを MusicBrainz + AcousticBrainz から取得して
// data/song_attributes.yml に書き込む。
//
//   node scripts/fetch-bpm.mjs           … BPM未設定の曲だけ取りに行く
//   node scripts/fetch-bpm.mjs --all     … 既存の値も上書きする
//   node scripts/fetch-bpm.mjs --limit 30 … 先頭N曲だけ試す
//
// 注意:
//  - AcousticBrainz は解析値なので、曲によっては倍/半分のテンポで出る。
//    おかしい値は選曲ノートから直せる(手で直した値は既定では上書きしない)。
//  - MusicBrainz は 1req/sec の制限があるため全曲だと数分かかる。
//  - AcousticBrainz は新規の解析収集を終了しているので、載っていない曲は取れない。
import fs from "node:fs";
import path from "node:path";

const UA =
  "nanawa-library/1.0 ( https://github.com/suneo3476/nanawa )";
const DATA = path.join(process.cwd(), "data");
const ATTRS = path.join(DATA, "song_attributes.yml");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const args = process.argv.slice(2);
const overwrite = args.includes("--all");
const limitArg = args.indexOf("--limit");
const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : Infinity;

/** songs.yml から id と title を読む */
function readSongs() {
  const songs = [];
  let id = null;
  for (const line of fs.readFileSync(path.join(DATA, "songs.yml"), "utf8").split("\n")) {
    const a = line.match(/^- id: (song\d+)/);
    if (a) id = a[1];
    const b = line.match(/^ {2}title: (.*)$/);
    if (b && id) songs.push({ id, title: b[1].replace(/^'|'$/g, "") });
  }
  return songs;
}

/** song_attributes.yml をブロック単位で読む */
function readAttrs() {
  const text = fs.readFileSync(ATTRS, "utf8");
  const blocks = text.split(/\n(?=- songId: )/);
  const head = blocks[0].startsWith("- songId:") ? "" : blocks.shift();
  const byId = new Map(
    blocks.map((b) => [b.match(/^- songId: (song\d+)/)[1], b.trimEnd()]),
  );
  return { head, byId };
}

function writeAttrs(head, byId) {
  const sorted = [...byId.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const header = head ? head.replace(/\n*$/, "\n\n") : "";
  fs.writeFileSync(ATTRS, `${header}${sorted.map(([, b]) => b).join("\n")}\n`);
}

/** MusicBrainz で aiko 名義の recording MBID を集める */
async function findMbids(title) {
  const query = `artist:aiko AND recording:"${title}"`;
  const url = `https://musicbrainz.org/ws/2/recording/?query=${encodeURIComponent(query)}&fmt=json&limit=15`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.recordings ?? [])
    .filter((r) => r["artist-credit"]?.[0]?.name === "aiko")
    .map((r) => r.id);
}

/** AcousticBrainz に解析データがあれば BPM を返す */
async function findBpm(mbids) {
  if (mbids.length === 0) return null;
  const res = await fetch(
    `https://acousticbrainz.org/api/v1/low-level?recording_ids=${mbids.slice(0, 25).join(";")}`,
  );
  if (!res.ok) return null;
  const json = await res.json();
  const values = [];
  for (const entry of Object.values(json)) {
    const bpm = entry?.["0"]?.rhythm?.bpm;
    if (bpm) values.push(bpm);
  }
  if (values.length === 0) return null;
  // 同じ曲の複数バージョンが取れたら中央値を採る(ライブ版などの外れ値対策)
  values.sort((a, b) => a - b);
  return Math.round(values[Math.floor(values.length / 2)]);
}

const songs = readSongs();
const { head, byId } = readAttrs();
const titles = new Map(songs.map((s) => [s.id, s.title]));

const targets = songs
  .filter((s) => overwrite || !/^ {2}bpm:/m.test(byId.get(s.id) ?? ""))
  .slice(0, limit);

console.log(
  `対象 ${targets.length}曲 (全${songs.length}曲${overwrite ? "・既存値も上書き" : "・BPM未設定のみ"})`,
);
console.log("MusicBrainzのレート制限(1req/sec)のため時間がかかります…\n");

let found = 0;
for (const [i, song] of targets.entries()) {
  let bpm = null;
  try {
    const mbids = await findMbids(song.title);
    await sleep(1100); // MusicBrainz: 1req/sec
    bpm = await findBpm(mbids);
  } catch (e) {
    console.warn(`  ! ${song.title}: ${String(e).slice(0, 60)}`);
  }

  if (bpm) {
    found++;
    const existing = byId.get(song.id) ?? "";
    const kept = existing
      .split("\n")
      .filter((l) => l && !/^ {2}bpm:/.test(l) && !/^- songId:/.test(l));
    byId.set(
      song.id,
      [
        `- songId: ${song.id}   # ${titles.get(song.id)}`,
        ...kept,
        `  bpm: ${bpm}`,
      ].join("\n"),
    );
  }

  if ((i + 1) % 10 === 0 || i === targets.length - 1) {
    writeAttrs(head, byId); // 途中で止めても成果が残るように逐次保存
    console.log(`  ${i + 1}/${targets.length} 件処理 (BPM取得 ${found}件)`);
  }
}

writeAttrs(head, byId);
console.log(
  `\n完了: ${found}/${targets.length}曲のBPMを取得しました (${Math.round((found / Math.max(1, targets.length)) * 100)}%)`,
);
console.log("※ AcousticBrainz の解析値です。倍/半分で出ることがあるので、");
console.log("   おかしい値は選曲ノートのテンポ表示から直してください。");

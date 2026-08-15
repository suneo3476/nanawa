// ローカル開発用のデータ書き込みAPI。
//
// このサイトは output:"export" の完全静的サイトなので、本番にサーバーは無い。
// 「選曲ノートで決めたセトリを data/*.yml に反映する」作業を手貼りせずに
// 済ませるための、ローカル専用の小さなAPI。
//
//   npm run dev   … Next.js と一緒に自動で起動(scripts/dev.mjs 経由)
//   npm run api   … 単体で起動
//
// 127.0.0.1 のみで待ち受け、data/ 配下の決まったファイルにしか書き込まない。
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = Number(process.env.NANAWA_API_PORT ?? 3100);
const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const LIVES = path.join(DATA_DIR, "lives.yml");
const SETLISTS = path.join(DATA_DIR, "setlists.yml");

const send = (res, status, body) => {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(body));
};

const readText = (p) => fs.readFileSync(p, "utf8");

/** YAMLのスカラーとして安全な形に整える */
function yamlStr(value) {
  const s = String(value ?? "");
  if (s === "") return "''";
  return /[:#'"\[\]{}&*!|>%@`]|^\s|\s$/.test(s) ? `'${s.replace(/'/g, "''")}'` : s;
}

function collectIds(text, key) {
  return new Set(
    [...text.matchAll(new RegExp(`^- ${key}: (\\S+)`, "gm"))].map((m) => m[1]),
  );
}

/** 既存データから次の liveId / eventId を決める */
function nextIds() {
  const text = readText(LIVES);
  const numbers = [...text.matchAll(/^- id: live(\d+)/gm)].map((m) => Number(m[1]));
  const eventIds = [...text.matchAll(/^ {2}eventId: (\d+)/gm)].map((m) => Number(m[1]));
  return {
    liveId: `live${String(Math.max(0, ...numbers) + 1).padStart(3, "0")}`,
    eventId: Math.max(0, ...eventIds) + 1,
  };
}

function validate(payload) {
  const errors = [];
  const { live, items } = payload ?? {};
  if (!live?.eventName) errors.push("イベント名が空です");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(live?.date ?? ""))
    errors.push("日付は YYYY-MM-DD 形式で指定してください");
  if (!Array.isArray(items) || items.length === 0)
    errors.push("曲が1曲もありません");

  const songIds = collectIds(readText(path.join(DATA_DIR, "songs.yml")), "id");
  for (const item of items ?? []) {
    if (!songIds.has(item.songId)) errors.push(`不明な songId: ${item.songId}`);
  }
  return errors;
}

function appendSetlist(payload) {
  const { live, items } = payload;
  const { liveId, eventId } = nextIds();

  const liveBlock =
    [
      `- id: ${liveId}`,
      `  eventId: ${eventId}`,
      `  date: '${live.date}'`,
      `  eventName: ${yamlStr(live.eventName)}`,
      `  venueName: ${yamlStr(live.venueName)}`,
      `  memo: ${yamlStr(live.memo)}`,
    ].join("\n") + "\n";

  const setlistBlock =
    items
      .map((item, i) =>
        [
          `- liveId: ${liveId}`,
          `  songId: ${item.songId}`,
          `  order: ${i + 1}`,
          `  type: ${item.type === "medley" ? "medley" : "individual"}`,
          `  memo: ${yamlStr(item.memo ?? "")}`,
          `  youtubeUrl: ${yamlStr(item.youtubeUrl ?? "")}`,
        ].join("\n"),
      )
      .join("\n") + "\n";

  // 既存ファイルは新しいライブが先頭。同じ並びを保つため先頭に差し込む。
  fs.writeFileSync(LIVES, liveBlock + readText(LIVES));
  fs.writeFileSync(SETLISTS, setlistBlock + readText(SETLISTS));
  return { liveId, eventId, count: items.length };
}

const MEMBERS = path.join(DATA_DIR, "members.yml");

/** メンバーと希望曲を data/members.yml に書き出す(全置換) */
function writeMembers(members) {
  const songIds = collectIds(readText(path.join(DATA_DIR, "songs.yml")), "id");
  const songTitles = new Map(
    [...readText(path.join(DATA_DIR, "songs.yml")).matchAll(
      /^- id: (song\d+)\n {2}title: (.*)$/gm,
    )].map((m) => [m[1], m[2].replace(/^'|'$/g, "")]),
  );
  const errors = [];
  if (!Array.isArray(members) || members.length === 0)
    errors.push("メンバーがいません");
  for (const m of members ?? []) {
    if (!m.name) errors.push("名前が空のメンバーがいます");
    for (const w of m.wishes ?? []) {
      if (!songIds.has(w)) errors.push(`不明な songId: ${w}`);
    }
  }
  if (errors.length) return { errors };

  const body = members
    .map((m) => {
      const head = [`- id: ${m.id}`, `  name: ${yamlStr(m.name)}`];
      if (!m.wishes?.length) return [...head, "  wishes: []"].join("\n");
      return [
        ...head,
        "  wishes:",
        ...m.wishes.map(
          (w) => `    - ${w}${songTitles.has(w) ? ` # ${songTitles.get(w)}` : ""}`,
        ),
      ].join("\n");
    })
    .join("\n");

  const header = [
    "# バンドメンバーと、その人がやりたい曲(選曲ノートの希望曲)。",
    "# 選曲ノートで「メンバーと希望曲を保存」を押すとこのファイルが更新されます。",
    "# 手で編集しても構いません(songId は data/songs.yml のID)。",
  ].join("\n");
  fs.writeFileSync(MEMBERS, `${header}\n${body}\n`);
  return { count: members.length };
}

const ATTRS = path.join(DATA_DIR, "song_attributes.yml");

/**
 * 曲のテンポ/バラードだけを差分更新する。
 * kouhaku や tieup など他の項目には触らない。
 */
function patchSongAttributes(edits) {
  const songIds = collectIds(readText(path.join(DATA_DIR, "songs.yml")), "id");
  const errors = [];
  if (!Array.isArray(edits) || edits.length === 0) errors.push("変更がありません");
  for (const e of edits ?? []) {
    if (!songIds.has(e.songId)) errors.push(`不明な songId: ${e.songId}`);
    if (e.tempo != null && !["up", "mid", "slow"].includes(e.tempo))
      errors.push(`不正な tempo: ${e.tempo}`);
  }
  if (errors.length) return { errors };

  const text = readText(ATTRS);
  const blocks = text.split(/\n(?=- songId: )/);
  const head = blocks[0].startsWith("- songId:") ? "" : blocks.shift();
  const byId = new Map(
    blocks.map((b) => [b.match(/^- songId: (song\d+)/)[1], b.trimEnd()]),
  );
  const titles = new Map(
    [
      ...readText(path.join(DATA_DIR, "songs.yml")).matchAll(
        /^- id: (song\d+)\n {2}title: (.*)$/gm,
      ),
    ].map((m) => [m[1], m[2].replace(/^'|'$/g, "")]),
  );

  for (const edit of edits) {
    const existing = byId.get(edit.songId) ?? "";
    // 既存の行から tempo / ballad を抜き、残りは保持する
    const kept = existing
      .split("\n")
      .filter((l) => l && !/^ {2}(tempo|ballad):/.test(l) && !/^- songId:/.test(l));
    const lines = [
      `- songId: ${edit.songId}${titles.has(edit.songId) ? `   # ${titles.get(edit.songId)}` : ""}`,
    ];
    if (edit.tempo) lines.push(`  tempo: ${edit.tempo}`);
    if (edit.ballad != null) lines.push(`  ballad: ${edit.ballad === true}`);
    lines.push(...kept);
    byId.set(edit.songId, lines.join("\n"));
  }

  const sorted = [...byId.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  // split で失われるヘッダー直後の改行を戻す
  const header = head ? head.replace(/\n*$/, "\n\n") : "";
  fs.writeFileSync(ATTRS, `${header}${sorted.map(([, b]) => b).join("\n")}\n`);
  return { count: edits.length };
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (req.method === "OPTIONS") return send(res, 204, {});

  if (req.method === "GET" && url.pathname === "/api/health") {
    return send(res, 200, { ok: true, ...nextIds() });
  }

  if (req.method === "POST" && url.pathname === "/api/song-attributes") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) req.destroy();
    });
    req.on("end", () => {
      try {
        const { edits } = JSON.parse(body);
        const result = patchSongAttributes(edits);
        if (result.errors) return send(res, 400, { ok: false, errors: result.errors });
        console.log(`✓ 曲の属性を${result.count}件更新しました`);
        return send(res, 200, { ok: true, count: result.count });
      } catch (e) {
        return send(res, 400, { ok: false, errors: [String(e)] });
      }
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/members") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) req.destroy();
    });
    req.on("end", () => {
      try {
        const { members } = JSON.parse(body);
        const result = writeMembers(members);
        if (result.errors) return send(res, 400, { ok: false, errors: result.errors });
        console.log(`✓ メンバー${result.count}人の希望曲を保存しました`);
        return send(res, 200, { ok: true, count: result.count });
      } catch (e) {
        return send(res, 400, { ok: false, errors: [String(e)] });
      }
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/setlist") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) req.destroy(); // 念のための上限
    });
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const errors = validate(payload);
        if (errors.length) return send(res, 400, { ok: false, errors });
        const result = appendSetlist(payload);
        console.log(
          `✓ ${result.liveId} (${payload.live.eventName}) を ${result.count}曲で追記しました`,
        );
        return send(res, 200, { ok: true, ...result });
      } catch (e) {
        return send(res, 400, { ok: false, errors: [String(e)] });
      }
    });
    return;
  }

  send(res, 404, { ok: false, errors: ["not found"] });
});

// ポートが既に使われている場合は、既存のAPIが動いているとみなして静かに終了する
// (dev.mjs 側は Next.js を巻き込まずに続行する)
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.warn(
      `データ書き込みAPI: ポート ${PORT} は使用中のため起動しません(既に動いている可能性があります)`,
    );
    process.exit(0);
  }
  console.error("データ書き込みAPI: 起動に失敗しました", err);
  process.exit(1);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`データ書き込みAPI: http://127.0.0.1:${PORT} (ローカル専用)`);
});

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

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (req.method === "OPTIONS") return send(res, 204, {});

  if (req.method === "GET" && url.pathname === "/api/health") {
    return send(res, 200, { ok: true, ...nextIds() });
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

server.listen(PORT, "127.0.0.1", () => {
  console.log(`データ書き込みAPI: http://127.0.0.1:${PORT} (ローカル専用)`);
});

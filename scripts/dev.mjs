// `npm run dev` の入口。Next.js の開発サーバーと、
// data/*.yml へ書き込むローカルAPI(scripts/data-server.mjs)を同時に起動する。
//
// 方針: 主役は Next.js。書き込みAPIはおまけなので、API が落ちても
// Next.js は止めない(APIが落ちたら1度だけ再起動を試みる)。
// 逆に Next.js が終了したら、こちらも後片付けして終了する。
import { spawn } from "node:child_process";

const children = new Set();
let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

/** 書き込みAPI: 落ちても Next.js は巻き込まない */
function startApi(attempt = 1) {
  const child = spawn(process.execPath, ["scripts/data-server.mjs"], {
    stdio: "inherit",
  });
  children.add(child);
  child.on("exit", (code) => {
    children.delete(child);
    if (shuttingDown) return;
    if (attempt < 2) {
      console.warn(
        `\n[data-server] が終了しました (code ${code})。再起動します…`,
      );
      setTimeout(() => startApi(attempt + 1), 1000);
    } else {
      console.warn(
        `\n[data-server] を起動できませんでした。書き込みAPIなしで続行します` +
          `(選曲ノートの保存は GitHub かYAML手貼りを使ってください)。`,
      );
    }
  });
}

/** Next.js: これが終わったら全体を終了する */
function startNext() {
  const child = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["next", "dev"],
    { stdio: "inherit" },
  );
  children.add(child);
  child.on("exit", (code) => {
    children.delete(child);
    if (!shuttingDown) {
      console.error(`\n[next dev] が終了しました (code ${code})`);
      shutdown(code ?? 0);
    }
  });
}

startApi();
startNext();

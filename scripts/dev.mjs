// `npm run dev` の入口。Next.js の開発サーバーと、
// data/*.yml へ書き込むローカルAPI(scripts/data-server.mjs)を同時に起動する。
// どちらかが落ちたらもう一方も終了させる。
import { spawn } from "node:child_process";

const children = [];

function run(command, args, name) {
  const child = spawn(command, args, { stdio: "inherit", shell: false });
  child.on("exit", (code) => {
    if (!shuttingDown) {
      console.error(`\n[${name}] が終了しました (code ${code})`);
      shutdown(code ?? 0);
    }
  });
  children.push(child);
  return child;
}

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

run(process.execPath, ["scripts/data-server.mjs"], "data-server");
run(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["next", "dev"],
  "next dev",
);

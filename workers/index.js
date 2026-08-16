/**
 * 七輪ライブラリーを Cloudflare Workers で配信する。
 *
 * out/(next build の静的出力)を ASSETS バインディング経由で返し、
 * その手前に Basic 認証を挟んで身内向けの簡易ロックにしている。
 * Vercel の Password Protection は Pro 限定なので、無料で鍵をかけたい場合はこちら。
 *
 * さらに /api/picker/ws で選曲ノートのリアルタイム同期(Durable Object)を提供する。
 *
 * 認証情報は **リポジトリに置かない**(このリポジトリは public)。
 * wrangler secret put か deploy --var で渡す。→ docs/DEPLOY.md
 */

export { PickerRoom } from "./picker-room.js";

const REALM = "nanawa";
const SESSION_COOKIE = "nanawa_session";

/** 一致するかどうか以外を漏らさない程度の定数時間比較 */
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function unauthorized() {
  return new Response("認証が必要です。\n", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

/**
 * Basic 認証の資格情報から導くセッショントークン。
 *
 * ブラウザの `new WebSocket()` は独自ヘッダを付けられないため、
 * WebSocket のハンドシェイクに Authorization が乗る保証がない。
 * そこで HTTP 側で認証が通った時にこのトークンを Cookie に載せ、
 * WebSocket はそれでも通れるようにしている。
 *
 * 強度は Basic のパスワードそのものと同じ(これを知る = パスワードを知る)。
 * ここが実質の防御線なので、それ以上の強度は求めていない。
 */
async function sessionToken(user, pass) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`${user}:${pass}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode("nanawa-session-v1"),
  );
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function readCookie(request, name) {
  const raw = request.headers.get("Cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

/** Authorization ヘッダが正しいか */
function checkBasic(request, user, pass) {
  const header = request.headers.get("Authorization") ?? "";
  if (!header.startsWith("Basic ")) return false;
  let decoded;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return false;
  }
  const sep = decoded.indexOf(":");
  if (sep < 0) return false;
  return (
    safeEqual(decoded.slice(0, sep), user) &&
    safeEqual(decoded.slice(sep + 1), pass)
  );
}

const handler = {
  async fetch(request, env) {
    const user = env.BASIC_AUTH_USER;
    const pass = env.BASIC_AUTH_PASS;

    // 未設定のまま素通しさせない。設定漏れが「全世界に公開」に化けるのを防ぐ
    if (!user || !pass) {
      return new Response(
        "BASIC_AUTH_USER / BASIC_AUTH_PASS が未設定です。\n",
        { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } },
      );
    }

    const token = await sessionToken(user, pass);
    const viaBasic = checkBasic(request, user, pass);
    const viaCookie = safeEqual(readCookie(request, SESSION_COOKIE) ?? "", token);
    const url = new URL(request.url);

    // どちらの経路で通ったかを実測するための確認用エンドポイント。
    // WebSocket ハンドシェイクに Authorization が乗るかを調べるのに使う
    if (url.pathname === "/api/whoami") {
      if (!viaBasic && !viaCookie) return unauthorized();
      return Response.json({
        viaBasic,
        viaCookie,
        upgrade: request.headers.get("Upgrade") ?? null,
      });
    }

    if (!viaBasic && !viaCookie) return unauthorized();

    // ---- 選曲ノートのリアルタイム同期 ----
    if (url.pathname === "/api/picker/ws" || url.pathname === "/api/picker") {
      // ルーム名で状態を分ける。今は七輪ひとつなので既定は "nanawa"
      const room = url.searchParams.get("room") || "nanawa";
      const id = env.PICKER_ROOM.idFromName(room);
      return env.PICKER_ROOM.get(id).fetch(request);
    }

    const response = await env.ASSETS.fetch(request);

    // HTML を返すときにセッションCookieを載せておく。
    // これで後続の WebSocket ハンドシェイクが Authorization 無しでも通る
    const type = response.headers.get("Content-Type") ?? "";
    if (viaBasic && type.includes("text/html")) {
      const withCookie = new Response(response.body, response);
      withCookie.headers.append(
        "Set-Cookie",
        `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000${
          url.protocol === "https:" ? "; Secure" : ""
        }`,
      );
      return withCookie;
    }
    return response;
  },
};

export default handler;

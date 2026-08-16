/**
 * 七輪ライブラリーを Cloudflare Workers で配信する。
 *
 * out/(next build の静的出力)を ASSETS バインディング経由で返すだけだが、
 * その手前に Basic 認証を挟んで身内向けの簡易ロックにしている。
 * Vercel の Password Protection は Pro 限定なので、無料で鍵をかけたい場合はこちら。
 *
 * 認証情報は **リポジトリに置かない**(このリポジトリは public)。
 * wrangler secret put か deploy --var で渡す。→ docs/DEPLOY.md
 */

const REALM = "nanawa";

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

export default {
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

    const header = request.headers.get("Authorization") ?? "";
    if (!header.startsWith("Basic ")) return unauthorized();

    let decoded;
    try {
      decoded = atob(header.slice(6));
    } catch {
      return unauthorized();
    }

    const sep = decoded.indexOf(":");
    if (sep < 0) return unauthorized();

    const ok =
      safeEqual(decoded.slice(0, sep), user) &&
      safeEqual(decoded.slice(sep + 1), pass);
    if (!ok) return unauthorized();

    return env.ASSETS.fetch(request);
  },
};

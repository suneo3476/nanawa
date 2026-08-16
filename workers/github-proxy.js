/**
 * GitHub への書き戻しを Worker が代理で行う。
 *
 * 目的は「利用者に GitHub を意識させないこと」。
 * 従来は保存したい人それぞれが Fine-grained PAT を作って画面に貼る必要があったが、
 * バンドのメンバーにトークンを作らせるのは筋が悪い。
 * 代わりに Worker が secret として持つトークン1本で代理コミットする。
 * トークンを作るのは管理者が最初の1回だけ。
 *
 * このエンドポイントは Basic 認証を通った人しか呼べない(呼び出し元で確認済み)。
 * さらに事故と悪用を防ぐため、ここで二重に絞る:
 *   - 触れるのは data/*.yml だけ(コードやワークフローは書き換えられない)
 *   - メソッドは GET と PUT だけ
 *   - owner/repo/branch はサーバ側の設定で固定(クライアントから指定させない)
 */

const GH_API = "https://api.github.com";

/** 書き換えを許すファイル。ここを広げるときは慎重に */
const ALLOWED_PATH = /^data\/[A-Za-z0-9_-]+\.yml$/;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

/** env から設定を読む。トークンが無ければ代理コミットは提供しない */
function config(env) {
  const token = env.GITHUB_TOKEN;
  const repo = env.GITHUB_REPO; // "owner/repo"
  if (!token || !repo) return null;
  const [owner, name] = repo.split("/");
  if (!owner || !name) return null;
  return {
    token,
    owner,
    repo: name,
    branch: env.GITHUB_BRANCH || "main",
  };
}

/**
 * @param request 元のリクエスト
 * @param env     Worker の環境(secret を含む)
 * @param rest    "/api/gh" より後ろのパス。"/status" か "/contents/<file>"
 */
export async function handleGithubProxy(request, env, rest) {
  const cfg = config(env);

  // 代理コミットが使えるかどうかをクライアントに伝える。
  // 使えなければ画面は従来どおり手動のGitHub設定にフォールバックする
  if (rest === "/status") {
    return json(
      cfg
        ? { available: true, owner: cfg.owner, repo: cfg.repo, branch: cfg.branch }
        : { available: false },
    );
  }

  // 何が許されるかはトークンの有無と関係ないので、先に形を検証する。
  // (こうしておくと設定前でも制限が効いていることを確かめられる)
  if (!rest.startsWith("/contents/")) {
    return json({ error: "不明なエンドポイントです。" }, 404);
  }

  const filePath = decodeURIComponent(rest.slice("/contents/".length));
  if (!ALLOWED_PATH.test(filePath)) {
    return json({ error: `このパスは書き換えられません: ${filePath}` }, 403);
  }

  if (request.method !== "GET" && request.method !== "PUT") {
    return json({ error: "GET と PUT のみ許可しています。" }, 405);
  }

  if (!cfg) {
    return json(
      { error: "サーバー側にGitHubトークンが設定されていません。" },
      503,
    );
  }

  const base = `${GH_API}/repos/${cfg.owner}/${cfg.repo}/contents/${filePath}`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${cfg.token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    // GitHub API は User-Agent を要求する
    "User-Agent": "nanawa-worker",
  };

  if (request.method === "GET") {
    const res = await fetch(
      `${base}?ref=${encodeURIComponent(cfg.branch)}`,
      { headers },
    );
    return new Response(res.body, {
      status: res.status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  // PUT: クライアントが送るのは message / content / sha だけ。
  // branch はサーバ側の設定を使い、クライアントには決めさせない
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "リクエストの形式が不正です。" }, 400);
  }

  const res = await fetch(base, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: String(body.message ?? "update: 選曲ノートからの保存"),
      content: String(body.content ?? ""),
      ...(body.sha ? { sha: String(body.sha) } : {}),
      branch: cfg.branch,
    }),
  });

  return new Response(res.body, {
    status: res.status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

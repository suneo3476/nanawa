/**
 * 決まったセトリを「ライブ記録データ(data/*.yml)」に反映するための保存先。
 *
 * このサイトは完全静的(output: "export")なので、環境によって使える手段が違う。
 *   local  … ローカル開発時。npm run dev で立つ書き込みAPIがファイルを直接更新する
 *   github … デプロイ後でも使える。GitHub の Contents API でリポジトリに直接コミットし、
 *            ホスティング側の自動ビルドでサイトに反映される(無料ホスティング前提の本命)
 *   manual … 上記が使えないときのフォールバック。YAMLをコピー/ダウンロードして手で貼る
 */

export type BackendKind = "local" | "github" | "manual";

export interface SetlistPayloadItem {
  songId: string;
  title?: string;
}

export interface SetlistPayload {
  live: {
    eventName: string;
    date: string;
    venueName: string;
    memo: string;
  };
  items: SetlistPayloadItem[];
}

export interface SaveResult {
  liveId: string;
  count: number;
  /** github の場合のコミットURL */
  url?: string;
}

export const LOCAL_API_BASE =
  process.env.NEXT_PUBLIC_NANAWA_API ?? "http://127.0.0.1:3100";

// ---- YAML生成(全バックエンド共通) ----

/** YAMLのスカラーとして安全な形に整える */
export function yamlStr(value: string): string {
  const s = value ?? "";
  if (s === "") return "''";
  return /[:#'"[\]{}&*!|>%@`]|^\s|\s$/.test(s)
    ? `'${s.replace(/'/g, "''")}'`
    : s;
}

export function buildLiveBlock(
  liveId: string,
  eventId: number,
  live: SetlistPayload["live"],
): string {
  return (
    [
      `- id: ${liveId}`,
      `  eventId: ${eventId}`,
      `  date: '${live.date}'`,
      `  eventName: ${yamlStr(live.eventName)}`,
      `  venueName: ${yamlStr(live.venueName)}`,
      `  memo: ${yamlStr(live.memo)}`,
    ].join("\n") + "\n"
  );
}

export function buildSetlistBlock(
  liveId: string,
  items: SetlistPayloadItem[],
  withComments = false,
): string {
  return (
    items
      .map((item, i) =>
        [
          `- liveId: ${liveId}`,
          `  songId: ${item.songId}${withComments && item.title ? `   # ${item.title}` : ""}`,
          `  order: ${i + 1}`,
          "  type: individual",
          "  memo: ''",
          "  youtubeUrl: ''",
        ].join("\n"),
      )
      .join("\n") + "\n"
  );
}

/** 手貼り用(コメント付き・見出し付き) */
export function buildManualYaml(
  liveId: string,
  eventId: number,
  payload: SetlistPayload,
): string {
  return [
    "# ▼ data/lives.yml の先頭に追記",
    buildLiveBlock(liveId, eventId, payload.live).trimEnd(),
    "",
    "# ▼ data/setlists.yml の先頭に追記",
    buildSetlistBlock(liveId, payload.items, true).trimEnd(),
    "",
  ].join("\n");
}

// ---- local ----

export async function checkLocalApi(): Promise<{
  liveId: string;
  eventId: number;
} | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${LOCAL_API_BASE}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return (await res.json()) as { liveId: string; eventId: number };
  } catch {
    return null;
  }
}

export async function saveViaLocal(payload: SetlistPayload): Promise<SaveResult> {
  const res = await fetch(`${LOCAL_API_BASE}/api/setlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as {
    ok: boolean;
    liveId?: string;
    count?: number;
    errors?: string[];
  };
  if (!json.ok) throw new Error((json.errors ?? ["保存に失敗しました"]).join("\n"));
  return { liveId: json.liveId!, count: json.count! };
}

// ---- メンバーと希望曲 ----

export interface MemberPayload {
  id: string;
  name: string;
  wishes: string[];
}

/** data/members.yml の中身を組み立てる */
export function buildMembersYaml(
  members: MemberPayload[],
  songTitle?: (songId: string) => string | undefined,
): string {
  const header = [
    "# バンドメンバーと、その人がやりたい曲(選曲ノートの希望曲)。",
    "# 選曲ノートで「メンバーと希望曲を保存」を押すとこのファイルが更新されます。",
    "# 手で編集しても構いません(songId は data/songs.yml のID)。",
  ].join("\n");
  const body = members
    .map((m) => {
      const head = [`- id: ${m.id}`, `  name: ${yamlStr(m.name)}`];
      if (m.wishes.length === 0) return [...head, "  wishes: []"].join("\n");
      return [
        ...head,
        "  wishes:",
        ...m.wishes.map((w) => {
          const title = songTitle?.(w);
          return `    - ${w}${title ? ` # ${title}` : ""}`;
        }),
      ].join("\n");
    })
    .join("\n");
  return `${header}\n${body}\n`;
}

export async function saveMembersViaLocal(
  members: MemberPayload[],
): Promise<number> {
  const res = await fetch(`${LOCAL_API_BASE}/api/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ members }),
  });
  const json = (await res.json()) as {
    ok: boolean;
    count?: number;
    errors?: string[];
  };
  if (!json.ok) throw new Error((json.errors ?? ["保存に失敗しました"]).join("\n"));
  return json.count ?? members.length;
}

// ---- 曲の属性(テンポ/バラード) ----

export interface SongAttrEdit {
  songId: string;
  /** null ならテンポ未設定のまま */
  tempo: "up" | "mid" | "slow" | null;
  ballad: boolean;
  /** 未指定なら既存のBPMを保つ。空文字は削除 */
  bpm?: number | null;
}

export async function saveSongAttrsViaLocal(
  edits: SongAttrEdit[],
): Promise<number> {
  const res = await fetch(`${LOCAL_API_BASE}/api/song-attributes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ edits }),
  });
  const json = (await res.json()) as {
    ok: boolean;
    count?: number;
    errors?: string[];
  };
  if (!json.ok) throw new Error((json.errors ?? ["保存に失敗しました"]).join("\n"));
  return json.count ?? edits.length;
}

// ---- github ----
// 静的ホスティングにデプロイした状態でも、ブラウザから GitHub の API を叩けば
// リポジトリのYAMLを更新できる。更新をトリガーにホスティング側が再ビルドすれば
// サイトに反映される。トークンは利用者自身のものを端末に保存して使う。

export interface GithubConfig {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

export const GITHUB_CONFIG_KEY = "nanawa-github-config-v1";

export function loadGithubConfig(): GithubConfig | null {
  try {
    const raw = localStorage.getItem(GITHUB_CONFIG_KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw) as GithubConfig;
    return cfg.owner && cfg.repo && cfg.token ? cfg : null;
  } catch {
    return null;
  }
}

export function saveGithubConfig(cfg: GithubConfig) {
  localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(cfg));
}

export function clearGithubConfig() {
  localStorage.removeItem(GITHUB_CONFIG_KEY);
}

const GH_API = "https://api.github.com";

async function ghFetch(
  cfg: GithubConfig,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${GH_API}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${cfg.token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init?.headers ?? {}),
    },
  });
}

interface GhFile {
  content: string;
  sha: string;
}

async function getFile(cfg: GithubConfig, filePath: string): Promise<GhFile> {
  const res = await ghFetch(
    cfg,
    `/repos/${cfg.owner}/${cfg.repo}/contents/${filePath}?ref=${encodeURIComponent(cfg.branch)}`,
  );
  if (!res.ok) {
    throw new Error(
      `${filePath} を取得できませんでした (${res.status})。リポジトリ名・ブランチ名・トークンの権限を確認してください。`,
    );
  }
  const json = (await res.json()) as { content: string; sha: string };
  return { content: decodeBase64(json.content), sha: json.sha };
}

async function putFile(
  cfg: GithubConfig,
  filePath: string,
  content: string,
  sha: string,
  message: string,
): Promise<{ commitUrl?: string }> {
  const res = await ghFetch(
    cfg,
    `/repos/${cfg.owner}/${cfg.repo}/contents/${filePath}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        content: encodeBase64(content),
        // 新規作成のときは sha を送らない
        ...(sha ? { sha } : {}),
        branch: cfg.branch,
      }),
    },
  );
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`${filePath} の更新に失敗しました (${res.status}): ${detail}`);
  }
  const json = (await res.json()) as { commit?: { html_url?: string } };
  return { commitUrl: json.commit?.html_url };
}

/** UTF-8 対応の base64 変換(GitHub API は base64 でやり取りする) */
function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function decodeBase64(b64: string): string {
  const bin = atob(b64.replace(/\n/g, ""));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** リポジトリの現状から次の liveId / eventId を決める */
export function nextIdsFromLives(livesYaml: string): {
  liveId: string;
  eventId: number;
} {
  const numbers = [...livesYaml.matchAll(/^- id: live(\d+)/gm)].map((m) =>
    Number(m[1]),
  );
  const eventIds = [...livesYaml.matchAll(/^ {2}eventId: (\d+)/gm)].map((m) =>
    Number(m[1]),
  );
  return {
    liveId: `live${String(Math.max(0, ...numbers) + 1).padStart(3, "0")}`,
    eventId: Math.max(0, ...eventIds) + 1,
  };
}

export async function saveViaGithub(
  cfg: GithubConfig,
  payload: SetlistPayload,
): Promise<SaveResult> {
  const lives = await getFile(cfg, "data/lives.yml");
  const setlists = await getFile(cfg, "data/setlists.yml");
  const { liveId, eventId } = nextIdsFromLives(lives.content);

  const message = `add: ${payload.live.eventName} (${payload.live.date}) のセトリを追加した`;
  // 既存ファイルは新しいライブが先頭なので、先頭に差し込む
  await putFile(
    cfg,
    "data/lives.yml",
    buildLiveBlock(liveId, eventId, payload.live) + lives.content,
    lives.sha,
    message,
  );
  const { commitUrl } = await putFile(
    cfg,
    "data/setlists.yml",
    buildSetlistBlock(liveId, payload.items) + setlists.content,
    setlists.sha,
    message,
  );

  return { liveId, count: payload.items.length, url: commitUrl };
}

export async function saveMembersViaGithub(
  cfg: GithubConfig,
  members: MemberPayload[],
  songTitle?: (songId: string) => string | undefined,
): Promise<number> {
  let sha: string | undefined;
  try {
    sha = (await getFile(cfg, "data/members.yml")).sha;
  } catch {
    sha = undefined; // まだファイルが無い場合は新規作成
  }
  await putFile(
    cfg,
    "data/members.yml",
    buildMembersYaml(members, songTitle),
    sha ?? "",
    "add: メンバーの希望曲を更新した",
  );
  return members.length;
}

/**
 * 曲のテンポ/バラードを GitHub 上の song_attributes.yml に反映する。
 * 他の項目(紅白・タイアップ)は保ったまま該当行だけ差し替える。
 */
export async function saveSongAttrsViaGithub(
  cfg: GithubConfig,
  edits: SongAttrEdit[],
  songTitle?: (songId: string) => string | undefined,
): Promise<number> {
  const file = await getFile(cfg, "data/song_attributes.yml");
  const blocks = file.content.split(/\n(?=- songId: )/);
  const head = blocks[0].startsWith("- songId:") ? "" : blocks.shift()!;
  const byId = new Map(
    blocks.map((b) => [b.match(/^- songId: (song\d+)/)![1], b.trimEnd()]),
  );
  for (const edit of edits) {
    const editsBpm = edit.bpm !== undefined;
    const kept = (byId.get(edit.songId) ?? "")
      .split("\n")
      .filter(
        (l) =>
          l &&
          !/^ {2}(tempo|ballad):/.test(l) &&
          !(editsBpm && /^ {2}bpm:/.test(l)) &&
          !/^- songId:/.test(l),
      );
    const title = songTitle?.(edit.songId);
    byId.set(
      edit.songId,
      [
        `- songId: ${edit.songId}${title ? `   # ${title}` : ""}`,
        ...(edit.tempo ? [`  tempo: ${edit.tempo}`] : []),
        `  ballad: ${edit.ballad}`,
        ...kept,
        ...(editsBpm && edit.bpm ? [`  bpm: ${edit.bpm}`] : []),
      ].join("\n"),
    );
  }
  const sorted = [...byId.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  // split で失われるヘッダー直後の改行を戻す
  const header = head ? head.replace(/\n*$/, "\n\n") : "";
  await putFile(
    cfg,
    "data/song_attributes.yml",
    `${header}${sorted.map(([, b]) => b).join("\n")}\n`,
    file.sha,
    "fix: 曲のテンポ/バラードを修正した",
  );
  return edits.length;
}

/** 設定したリポジトリ/ブランチ/トークンで読み書きできるかを確認する */
export async function checkGithub(cfg: GithubConfig): Promise<{
  liveId: string;
  eventId: number;
  canWrite: boolean;
}> {
  const lives = await getFile(cfg, "data/lives.yml");
  const ids = nextIdsFromLives(lives.content);
  const res = await ghFetch(cfg, `/repos/${cfg.owner}/${cfg.repo}`);
  const repo = res.ok
    ? ((await res.json()) as { permissions?: { push?: boolean } })
    : null;
  return { ...ids, canWrite: repo?.permissions?.push ?? false };
}

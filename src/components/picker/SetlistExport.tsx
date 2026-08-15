"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildManualYaml,
  checkGithub,
  checkLocalApi,
  clearGithubConfig,
  loadGithubConfig,
  saveGithubConfig,
  saveViaGithub,
  saveViaLocal,
  type BackendKind,
  type GithubConfig,
  type SaveResult,
  type SetlistPayload,
} from "@/lib/setlist-backend";
import type { Draft, PickerSong } from "./types";

const DEFAULT_GH: GithubConfig = {
  owner: "suneo3476",
  repo: "nanawa",
  branch: "develop",
  token: "",
};

/**
 * できたセトリをライブ記録データに反映する。
 * 保存先は環境に応じて3通り(ローカルAPI / GitHub / 手貼り)。
 */
export function SetlistExport({
  draft,
  songById,
  nextLiveNumber,
  nextEventId,
  onClose,
}: {
  draft: Draft;
  songById: Map<string, PickerSong>;
  nextLiveNumber: number;
  nextEventId: number;
  onClose: () => void;
}) {
  const [confirmedOnly, setConfirmedOnly] = useState(
    draft.items.some((i) => i.confirmed),
  );
  const [backend, setBackend] = useState<BackendKind>("manual");
  const [localReady, setLocalReady] = useState<{
    liveId: string;
    eventId: number;
  } | null>(null);
  const [gh, setGh] = useState<GithubConfig>(DEFAULT_GH);
  const [ghStatus, setGhStatus] = useState<
    "idle" | "checking" | "ok" | "error"
  >("idle");
  const [ghInfo, setGhInfo] = useState<{ liveId: string; eventId: number } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<SaveResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [showYaml, setShowYaml] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // 使える保存先を調べる: ローカルAPI優先、次にGitHub設定済みなら github
  useEffect(() => {
    let alive = true;
    const saved = loadGithubConfig();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 外部ストア(localStorage)からの初期化
    if (saved) setGh(saved);
    checkLocalApi().then((info) => {
      if (!alive) return;
      // 外部(ローカルAPIの有無)を調べた結果で初期の保存先を決める
       
      if (info) {
        setLocalReady(info);
        setBackend("local");
      } else if (saved) {
        setBackend("github");
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const items = useMemo(
    () => (confirmedOnly ? draft.items.filter((i) => i.confirmed) : draft.items),
    [draft.items, confirmedOnly],
  );

  const payload: SetlistPayload = useMemo(
    () => ({
      live: {
        eventName: draft.eventName,
        date: draft.date,
        venueName: draft.venueName,
        memo: draft.memo,
      },
      items: items.map((i) => ({
        songId: i.songId,
        title: songById.get(i.songId)?.title,
      })),
    }),
    [draft, items, songById],
  );

  const liveId =
    backend === "local" && localReady
      ? localReady.liveId
      : backend === "github" && ghInfo
        ? ghInfo.liveId
        : `live${String(nextLiveNumber).padStart(3, "0")}`;
  const eventId =
    backend === "local" && localReady
      ? localReady.eventId
      : backend === "github" && ghInfo
        ? ghInfo.eventId
        : nextEventId;

  const missingDate = !/^\d{4}-\d{2}-\d{2}$/.test(draft.date);
  const missingName = !draft.eventName.trim();
  const canSave = !missingDate && !missingName && items.length > 0;

  const yaml = useMemo(
    () => buildManualYaml(liveId, eventId, payload),
    [liveId, eventId, payload],
  );

  const verifyGithub = async () => {
    setGhStatus("checking");
    setErrors([]);
    try {
      const info = await checkGithub(gh);
      saveGithubConfig(gh);
      setGhInfo(info);
      setGhStatus("ok");
      if (!info.canWrite) {
        setErrors([
          "このトークンには書き込み権限が無いようです(Contents: Read and write が必要)。",
        ]);
      }
    } catch (e) {
      setGhStatus("error");
      setErrors([e instanceof Error ? e.message : String(e)]);
    }
  };

  const save = async () => {
    setSaving(true);
    setErrors([]);
    try {
      const result =
        backend === "local"
          ? await saveViaLocal(payload)
          : await saveViaGithub(gh, payload);
      setSaved(result);
    } catch (e) {
      setErrors([e instanceof Error ? e.message : String(e)]);
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(yaml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const download = () => {
    const blob = new Blob([yaml], { type: "text/yaml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${liveId}-setlist.yml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[8vh] backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="ライブ記録に登録する"
    >
      <div
        className="flex max-h-[82vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-bold">ライブ記録に登録する</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="rounded p-1 text-muted hover:text-foreground"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {saved ? (
            <div className="rounded-lg border border-accent/40 bg-accent-soft p-3">
              <p className="text-sm font-semibold text-accent-strong">
                {saved.liveId} として {saved.count}曲を登録しました
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                {backend === "local"
                  ? "data/lives.yml と data/setlists.yml に追記しました。開発サーバーが読み直すのでライブ履歴に反映されています。"
                  : "リポジトリにコミットしました。ホスティング側の再ビルドが終わればサイトに反映されます。"}
              </p>
              <div className="mt-2 flex gap-2">
                <a
                  href={`/lives/${saved.liveId}/`}
                  className="inline-block rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-strong"
                >
                  追加されたライブを見る
                </a>
                {saved.url && (
                  <a
                    href={saved.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:border-accent hover:text-foreground"
                  >
                    コミットを見る
                  </a>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* 保存先の選択 */}
              <div className="flex flex-wrap gap-1.5">
                <BackendTab
                  active={backend === "local"}
                  disabled={!localReady}
                  onClick={() => setBackend("local")}
                >
                  この端末のファイル
                  {!localReady && <span className="ml-1 opacity-60">(未起動)</span>}
                </BackendTab>
                <BackendTab
                  active={backend === "github"}
                  onClick={() => setBackend("github")}
                >
                  GitHub にコミット
                </BackendTab>
                <BackendTab
                  active={backend === "manual"}
                  onClick={() => setBackend("manual")}
                >
                  YAMLを手で貼る
                </BackendTab>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-muted">
                {backend === "local" &&
                  "npm run dev で動いている書き込みAPIが data/*.yml を直接更新します(開発中のみ)。"}
                {backend === "github" &&
                  "ブラウザから GitHub にコミットします。デプロイ後のサイトからでも使えて、コミットをきっかけにホスティング側が再ビルドすれば公開サイトに反映されます。"}
                {backend === "manual" &&
                  "YAMLをコピー/ダウンロードして data/*.yml に貼り付けてください。"}
              </p>

              {backend === "github" && (
                <div className="mt-2.5 space-y-1.5 rounded-lg border border-border bg-background p-3">
                  <div className="flex gap-1.5">
                    <input
                      value={gh.owner}
                      onChange={(e) => setGh({ ...gh, owner: e.target.value })}
                      placeholder="owner"
                      aria-label="GitHubのオーナー名"
                      className="min-w-0 flex-1 rounded border border-border bg-surface px-2 py-1 text-xs outline-none focus:border-accent"
                    />
                    <input
                      value={gh.repo}
                      onChange={(e) => setGh({ ...gh, repo: e.target.value })}
                      placeholder="repo"
                      aria-label="リポジトリ名"
                      className="min-w-0 flex-1 rounded border border-border bg-surface px-2 py-1 text-xs outline-none focus:border-accent"
                    />
                    <input
                      value={gh.branch}
                      onChange={(e) => setGh({ ...gh, branch: e.target.value })}
                      placeholder="branch"
                      aria-label="ブランチ名"
                      className="w-24 shrink-0 rounded border border-border bg-surface px-2 py-1 text-xs outline-none focus:border-accent"
                    />
                  </div>
                  <input
                    type="password"
                    value={gh.token}
                    onChange={(e) => setGh({ ...gh, token: e.target.value })}
                    placeholder="アクセストークン (github_pat_...)"
                    aria-label="GitHubのアクセストークン"
                    autoComplete="off"
                    className="w-full rounded border border-border bg-surface px-2 py-1 text-xs outline-none focus:border-accent"
                  />
                  <p className="text-[10px] leading-relaxed text-muted">
                    Fine-grained token を このリポジトリのみ / Contents: Read and write
                    で作ってください。トークンはこの端末(localStorage)にだけ保存され、GitHub
                    以外には送信しません。共用端末では使わないでください。
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={verifyGithub}
                      disabled={!gh.token || ghStatus === "checking"}
                      className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-muted hover:border-accent hover:text-foreground disabled:opacity-40"
                    >
                      {ghStatus === "checking" ? "確認中…" : "接続を確認"}
                    </button>
                    {ghStatus === "ok" && ghInfo && (
                      <span className="text-[11px] text-accent-strong">
                        OK — 次は {ghInfo.liveId}
                      </span>
                    )}
                    {gh.token && (
                      <button
                        type="button"
                        onClick={() => {
                          clearGithubConfig();
                          setGh({ ...DEFAULT_GH });
                          setGhStatus("idle");
                          setGhInfo(null);
                        }}
                        className="ml-auto text-[11px] text-muted underline underline-offset-2 hover:text-foreground"
                      >
                        トークンを消す
                      </button>
                    )}
                  </div>
                </div>
              )}

              {(missingDate || missingName) && (
                <ul className="mt-2 list-disc rounded-lg bg-accent-soft px-5 py-2 text-[11px] text-accent-strong">
                  {missingName && <li>イベント名を入力してください</li>}
                  {missingDate && <li>開催日(YYYY-MM-DD)を入力してください</li>}
                </ul>
              )}

              {errors.length > 0 && (
                <ul className="mt-2 list-disc rounded-lg bg-[#fbe9e9] px-5 py-2 text-[11px] break-words text-[#9b2b2b] dark:bg-[#3a1a1a] dark:text-[#e59a9a]">
                  {errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}

              {draft.items.some((i) => i.confirmed) && (
                <label className="mt-3 flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={confirmedOnly}
                    onChange={(e) => setConfirmedOnly(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[var(--accent)]"
                  />
                  確定した曲だけを登録する(
                  {draft.items.filter((i) => i.confirmed).length}曲)
                </label>
              )}

              <ol className="mt-3 space-y-0.5 rounded-lg border border-border bg-background p-3 text-xs">
                {items.map((item, i) => (
                  <li key={item.songId} className="flex gap-2">
                    <span className="w-4 shrink-0 text-right font-mono tabular-nums text-muted">
                      {i + 1}
                    </span>
                    <span className="truncate">
                      {songById.get(item.songId)?.title ?? item.songId}
                    </span>
                  </li>
                ))}
              </ol>

              <button
                type="button"
                onClick={() => setShowYaml(!showYaml)}
                aria-expanded={showYaml}
                className="mt-3 text-[11px] text-muted underline underline-offset-2 hover:text-foreground"
              >
                {showYaml ? "YAMLを隠す" : "書き込まれる内容(YAML)を見る"}
              </button>
              {showYaml && (
                <pre className="mt-2 overflow-x-auto rounded-lg border border-border bg-background p-3 font-mono text-[11px] leading-relaxed">
                  {yaml}
                </pre>
              )}
            </>
          )}
        </div>

        {!saved && (
          <div className="flex gap-2 border-t border-border px-4 py-3">
            {backend === "manual" ? (
              <>
                <button
                  type="button"
                  onClick={copy}
                  className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
                >
                  {copied ? "コピーしました ✓" : "YAMLをコピー"}
                </button>
                <button
                  type="button"
                  onClick={download}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-foreground"
                >
                  .yml で保存
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={save}
                  disabled={
                    !canSave ||
                    saving ||
                    (backend === "github" && ghStatus !== "ok") ||
                    (backend === "local" && !localReady)
                  }
                  className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:opacity-40"
                >
                  {saving
                    ? "登録しています…"
                    : backend === "github"
                      ? "GitHub にコミットする"
                      : "ライブ記録に追加する"}
                </button>
                <button
                  type="button"
                  onClick={copy}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-foreground"
                >
                  {copied ? "コピー ✓" : "YAML"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function BackendTab({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
        active
          ? "bg-accent-soft text-accent-strong"
          : "text-muted hover:bg-surface-2 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

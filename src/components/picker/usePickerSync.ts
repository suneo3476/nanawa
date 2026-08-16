"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { applyOp, EMPTY_STORE, type PickerOp, type Store } from "@/lib/picker-ops";

const STORAGE_KEY = "nanawa-picker-v2";

/** 切断中に貯める操作の上限。長時間切れたまま操作し続けても際限なく膨らませない */
const MAX_PENDING = 500;

/**
 * 同期の状態。
 *   connecting … 接続中(初回)
 *   online     … サーバと同期している。他のメンバーの操作が届く
 *   offline    … サーバに繋がらない。localStorage だけで動く(単独では使える)
 */
export type SyncStatus = "connecting" | "online" | "offline";

/** サーバに繋がらない環境(next dev 単体など)でも壊れないようにする */
function loadLocal(): Store | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Store;
    return parsed?.drafts?.length ? parsed : null;
  } catch {
    return null;
  }
}

function saveLocal(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // 保存できなくても致命的ではない
  }
}

/**
 * 選曲ノートの状態をメンバー間で同期する。
 *
 * クライアントは op だけを送り、サーバ(Durable Object)が確定した状態を配る。
 * 押した瞬間の体感を良くするため、送信と同時にローカルにも同じ op を適用する
 * (applyOp をサーバと共有しているので、結果は必ず一致する)。
 *
 * @param initial 接続できるまでの初期値
 */
export function usePickerSync(initial: Store) {
  const [store, setStore] = useState<Store>(initial);
  const [status, setStatus] = useState<SyncStatus>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const storeRef = useRef(store);
  const seededRef = useRef(false);
  const closedRef = useRef(false);
  const initialRef = useRef(initial);
  /** 切断中に行われた操作。再接続したら順に送り直す */
  const pendingRef = useRef<PickerOp[]>([]);

  useEffect(() => {
    storeRef.current = store;
  }, [store]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    closedRef.current = false;

    let retry = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let keepAlive: ReturnType<typeof setInterval> | undefined;

    const connect = () => {
      if (closedRef.current) return;

      let ws: WebSocket;
      try {
        const proto = location.protocol === "https:" ? "wss:" : "ws:";
        ws = new WebSocket(`${proto}//${location.host}/api/picker/ws`);
      } catch {
        scheduleRetry();
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        retry = 0;
        // 中継機に切られないよう定期的に叩く
        keepAlive = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 45_000);
      };

      ws.onmessage = (e) => {
        let msg;
        try {
          msg = JSON.parse(e.data as string);
        } catch {
          return;
        }
        if (msg.type !== "sync") return;

        setStatus("online");

        // 初回同期: サーバがまだ空なら、こちらの内容で種を蒔く。
        // ローカルに作りかけがあればそれを、無ければ初期セトリを送る
        // (誰もいない状態で開いてもセトリが1件はある状態にする)。
        // 同時に複数人が繋いでも store.seed は「サーバが空のときだけ」効くので先着1件で決まる。
        if (!seededRef.current) {
          seededRef.current = true;
          if (!msg.store?.drafts?.length) {
            const seed = loadLocal() ?? initialRef.current;
            if (seed.drafts.length) {
              // seed にオフライン中の変更も含まれているので、送り直す必要はない
              pendingRef.current = [];
              ws.send(
                JSON.stringify({ type: "op", op: { type: "store.seed", store: seed } }),
              );
              return; // seed の結果が sync で返ってくるのでそれを待つ
            }
          }
        }

        // 再接続時: 切れている間の操作を送り直す。
        // これをしないとサーバの状態で上書きされ、オフライン中の編集が黙って消える。
        if (pendingRef.current.length > 0) {
          const queued = pendingRef.current;
          pendingRef.current = [];
          for (const q of queued) {
            ws.send(JSON.stringify({ type: "op", op: q }));
          }
        }

        const next: Store = msg.store ?? EMPTY_STORE;
        setStore(next);
        saveLocal(next); // サーバが落ちても直前の状態は手元に残す
      };

      ws.onclose = () => {
        clearInterval(keepAlive);
        wsRef.current = null;
        if (!closedRef.current) scheduleRetry();
      };

      ws.onerror = () => {
        // onclose が続けて呼ばれるので、ここでは何もしない
      };
    };

    const scheduleRetry = () => {
      if (closedRef.current) return;
      setStatus("offline");
      // 初回だけローカルの内容で動けるようにしておく
      const local = loadLocal();
      if (local && storeRef.current.drafts.length === 0) setStore(local);
      // 1秒 → 2 → 4 …最大30秒
      const wait = Math.min(30_000, 1000 * 2 ** retry);
      retry += 1;
      timer = setTimeout(connect, wait);
    };

    connect();

    return () => {
      closedRef.current = true;
      clearTimeout(timer);
      clearInterval(keepAlive);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  /**
   * 操作を送る。同時にローカルにも適用して即座に画面へ反映する。
   * サーバに繋がっていない時はローカルのみ(localStorage に保存される)。
   */
  const sendOp = useCallback((op: PickerOp) => {
    setStore((prev) => {
      const next = applyOp(prev, op);
      if (next !== prev) saveLocal(next);
      return next;
    });
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "op", op }));
    } else if (pendingRef.current.length < MAX_PENDING) {
      // 切断中。再接続したときに送り直す
      pendingRef.current.push(op);
    }
  }, []);

  return { store, status, sendOp };
}

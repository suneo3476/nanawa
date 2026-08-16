/**
 * 選曲ノートの共有状態を持つ Durable Object。
 *
 * 設計: クライアントは「操作(op)」だけを送る。状態を丸ごと送らせない。
 * DO が唯一の書き手として op を順に適用し、確定した状態を全員に配る。
 * DO はシングルスレッドなので op は自然に直列化され、
 * 「7人が同時に触ると誰かの変更が消える」が原理的に起きない。
 *
 * op の意味づけ(applyOp)は src/lib/picker-ops.ts にあり、
 * **クライアントと共有している**。同じ関数で適用するので、
 * クライアント側の楽観更新とサーバの確定結果が必ず一致する。
 */

import { DurableObject } from "cloudflare:workers";
import { applyOp, EMPTY_STORE } from "../src/lib/picker-ops";

export class PickerRoom extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.store = EMPTY_STORE;
    this.version = 0;
    // hibernation から復帰するとコンストラクタが再実行されるので、
    // 最初のイベントを捌く前に必ず状態を読み直す
    ctx.blockConcurrencyWhile(async () => {
      this.store = (await ctx.storage.get("store")) ?? EMPTY_STORE;
      this.version = (await ctx.storage.get("version")) ?? 0;
    });
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      // WebSocket が使えない環境向けのフォールバック(現在の状態を返すだけ)
      return Response.json({ version: this.version, store: this.store });
    }

    const [client, server] = Object.values(new WebSocketPair());
    // acceptWebSocket を使うと hibernation の対象になり、
    // 誰も操作していない間は接続を保ったまま課金が止まる
    this.ctx.acceptWebSocket(server);
    server.send(
      JSON.stringify({ type: "sync", version: this.version, store: this.store }),
    );

    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, raw) {
    let msg;
    try {
      msg = JSON.parse(
        typeof raw === "string" ? raw : new TextDecoder().decode(raw),
      );
    } catch {
      return;
    }

    if (msg.type === "ping") {
      ws.send(JSON.stringify({ type: "pong" }));
      return;
    }
    if (msg.type !== "op") return;

    const next = applyOp(this.store, msg.op);
    if (next === this.store) return; // 状態が変わらない op は配らない

    this.store = next;
    this.version += 1;
    await this.ctx.storage.put("store", this.store);
    await this.ctx.storage.put("version", this.version);

    this.broadcast({
      type: "sync",
      version: this.version,
      store: this.store,
      opType: msg.op.type,
    });
  }

  async webSocketClose(ws, code, reason) {
    // 1005 (No Status Received) をそのまま返すとエラーになるので潰す
    ws.close(code === 1005 ? 1000 : code, reason);
  }

  async webSocketError(ws) {
    try {
      ws.close(1011, "internal error");
    } catch {
      // 既に閉じている
    }
  }

  broadcast(obj) {
    const payload = JSON.stringify(obj);
    for (const peer of this.ctx.getWebSockets()) {
      try {
        peer.send(payload);
      } catch {
        // 切断済みのソケットは無視する
      }
    }
  }
}

# デプロイ

ホスティングは **Vercel**(Hobby プラン・無料)を使う。

## なぜ Vercel か

| | Vercel | Cloudflare Workers |
| --- | --- | --- |
| Next.js 対応 | 純正。設定ファイル不要 | OpenNext アダプタ経由 |
| サーバーサイド | `output: "export"` を外すだけで API Routes / Server Actions が動く | Workers。D1/R2/KV が無料枠で付く |
| 商用利用 | **Hobby は不可**($20/月の Pro が必要) | 無料枠でも可 |

このアプリは Next.js 16 なので Vercel なら移行コストがゼロで、
「サーバーサイドも使えるようにしておきたい」という要件を後から満たせる。
身内向け=非商用なので Hobby の制約にも当たらない。

将来これで収益を出す(広告・課金・受託)なら、Pro に上げるか
Cloudflare Workers に移す判断が要る。→ [OpenNext](https://opennext.js.org/cloudflare)

## 初回セットアップ(GitHub 連携・推奨)

1. https://vercel.com にログイン(GitHub アカウントでOK)
2. **Add New… → Project** から `suneo3476/nanawa` を Import
3. 設定はすべて自動検出のままでよい。環境変数も不要
   - Framework: Next.js / Build: `npm run build` / Output: 自動
4. Deploy

以降は `main` に push するたびに自動でビルド・公開される。
`develop` など他ブランチへの push はプレビューURLが自動で作られる。

## CLI から手動デプロイ

```bash
npx vercel login
npx vercel --prod
```

アカウントなしで試すだけなら:

```bash
npx vercel deploy --temporary
```

一時URLが出る(**1時間で消える**)。表示される claim URL を開くと自分のアカウントに取り込める。

## Hobby プランの上限(2026年時点)

100GB 転送 / 100万リクエスト / 100万関数実行 / ビルド 6,000分 — いずれも身内利用では当たらない。

## 公開後の注意

- Vercel のサイトは**認証なしで誰でも見られる**。リポジトリが既に public なので新たな露出はないが、
  鍵をかけたいなら Vercel の Password Protection は Pro 限定。無料で済ませるなら下記の Cloudflare 経路
- **書き込みAPI(`scripts/data-server.mjs`)は公開先では動かない**。
  デプロイ後にセトリを保存する経路は `github`(GitHub Contents API)のみ。
  利用者が Fine-grained PAT(`suneo3476/nanawa` のみ / Contents: Read and write)を
  画面から設定する。→ `src/lib/setlist-backend.ts`
- データを書き換えると GitHub にコミットが載り、Vercel が自動で再ビルドして反映される

## サーバーサイドを使いたくなったら

`next.config.ts` の `output: "export"` と `trailingSlash: true` を外す。
これだけで API Routes / Server Actions / SSR が使えるようになり、
`data-server.mjs` がやっていた書き込みも本番で動かせる(認証は別途必要)。

---

## もうひとつの経路: Cloudflare Workers(Basic認証つき)

「身内だけに見せたい」を無料でやるならこちら。
`out/` を Workers の静的アセットとして配信し、その手前に Worker で Basic 認証を挟む。
`output: "export"` のままでよいので Vercel 側の構成と共存できる。

- `wrangler.jsonc` … `assets.run_worker_first: true` で全パスを Worker に通す
- `workers/index.js` … Basic 認証。未設定なら素通しせず 500 で止める

### 初回セットアップ

```bash
npx wrangler login
npx wrangler secret put BASIC_AUTH_USER
npx wrangler secret put BASIC_AUTH_PASS
npm run build && npx wrangler deploy
```

**注意**: `deploy --var` で先に平文の環境変数を入れていると、同じ名前の secret を作れない
(`Binding name 'X' already in use` になる)。先に `--var` なしで一度 deploy して
平文 var を消してから `secret put` すること。その間は認証情報が未設定になるが、
Worker は 500 で止まる作りなので開放されることはない。

### アカウントなしでお試し

```bash
npm run build
npx wrangler deploy --temporary --var BASIC_AUTH_USER:xxx --var BASIC_AUTH_PASS:xxx
```

出力の **Claim URL は 60 分で失効**する。claim すればそのアカウントごと自分のものになる。
`--var` は平文の環境変数なので、本番では上記の `wrangler secret put` を使うこと。

### 認証情報をコミットしない理由

このリポジトリは public。`wrangler.jsonc` に書くとパスワードがそのまま公開され、
鍵をかけた意味がなくなる。必ず secret か `--var` で外から渡す。

### Vercel と比べたときの損得

- 得: 無料で Basic 認証、商用利用も可、D1/R2/KV が無料枠で付く
- 損: Next.js のサーバー機能(SSR / API Routes)を使うには
  [OpenNext](https://opennext.js.org/cloudflare) アダプタ経由になる

---

## 選曲ノートのリアルタイム同期(Durable Object)

メンバーが各自のスマホから同時に選曲できるよう、状態を Durable Object で共有している。

- `workers/picker-room.js` … 共有状態を持つ DO
- エンドポイント … `wss://<host>/api/picker/ws`(WebSocket) / `GET /api/picker`(現在の状態)

### 設計

**クライアントは操作(op)だけを送り、状態を丸ごと送らない。**
DO が唯一の書き手として op を順に適用し、確定した状態を全員に配る。
DO はシングルスレッドなので op が自然に直列化され、
「7人が同時に触ると誰かの変更が消える」が原理的に起きない。

ポーリング + D1 だと、この直列化を自前で設計する必要があり、
実装行数は減っても状態管理の難易度は上がる。リアルタイムにした方がむしろ素直。

### hibernation

`ctx.acceptWebSocket()` で受けているので、誰も操作していない間は
接続を保ったまま DO がメモリから落ち、課金が止まる。
7人が2時間つなぎっぱなしでも、課金対象は実際に操作した瞬間だけ。

### WebSocket の認証

ブラウザの `new WebSocket()` は独自ヘッダを付けられないため、
ハンドシェイクに Basic の Authorization が乗る保証がない。
そこで **Authorization ヘッダと セッションCookie の両方**を受け付けている。

- HTTP で認証が通った時に `nanawa_session` Cookie(HttpOnly / SameSite=Strict / Secure)を発行
- WebSocket はヘッダでも Cookie でも通る

実測では Chromium 系はハンドシェイクに Authorization を送っていた。
**Safari(WebKit)でも本番URLで接続できることを確認済み**(画面のバッジが「同期中」になる)。

どちらの経路で通ったかまでは切り分けていないが、両方受け付ける実装なので
片方が塞がれても動く。**この二重化は外さないこと** — ブラウザや iOS の更新で
WebSocket ハンドシェイクの資格情報の扱いが変わっても、もう片方で通るようにしてある。

### 何が共有されるか

- **セトリ案** … 曲・曲順・確定フラグ・ライブ情報・方向性
- **メンバーと希望曲** … ♥の登録
- **曲の特徴の直し** … テンポ / バラード / BPM

テンポとバラードはバンド全員の耳で合わせるものなので、端末に閉じ込めず共有する
(`Store.songAttrs`)。各自のスマホで直すと即座に全員へ反映される。

ただし**共有されるのは「未確定の直し」まで**で、記録の本体は `data/song_attributes.yml`。
「曲データに保存」で YAML に書き戻せたら、全員ぶんの直しを消す(`attr.clearAll`)。
YAML への書き戻しには GitHub の設定(Fine-grained PAT)が要る。

元の値に戻す操作をすると、直しそのものが取り下げられる(差分が無いものを残さない)。

### オフラインでの扱い

サーバに繋がらない間もアプリは使える(バッジが「この端末のみ」になる)。
そのときの操作はキューに貯まり、**再接続したときに送り直される**。
これが無いとサーバの状態で上書きされ、オフライン中の編集が黙って消える。

ただしローカルの状態とサーバの状態が食い違った場合、最終的にはサーバが正になる。

### 動作確認済みのこと(本番)

3クライアントで同時に op を送っても全部残る / 全員切断後の再接続で状態が復元される /
重複追加など無変化の op では broadcast しない /
別端末で曲を追加すると相手の画面に出る / オフライン中の編集が復帰後も保持される。

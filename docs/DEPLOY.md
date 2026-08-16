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

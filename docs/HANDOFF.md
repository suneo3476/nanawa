# 引き継ぎメモ

新しいセッションで作業を再開するための現状まとめ。最終更新 2026-08-16。

## これは何

aikoコピーバンド「七輪」のライブ記録アーカイブ v3。
「この曲やった? いつ? どこで?」に最短で答えることと、次のライブの選曲を助けることが目的。

- リポジトリ: `suneo3476/nanawa` / **作業ブランチは `develop`**
- リリースPR: [#22](https://github.com/suneo3476/nanawa/pull/22) は **2026-08-16 にマージ済み**
- ローカル: `/Users/saku/skillup/nanawa-v3`(フォルダ名は仮。ユーザーは名前に納得していない)

## 起動と確認

```bash
npm run dev     # Next.js(:3000) と 書き込みAPI(:3100) が同時に立つ
npm run build   # 静的ビルド。データ不整合はここでエラーになる
npm run lint
```

- 検証は Vivaldi で行う(claude-in-chrome。ユーザーが開いてくれている)
- `npm run dev` が落ちても書き込みAPIは道連れにしない作りにしてある

## 画面

| パス | 内容 |
| --- | --- |
| `/` | ライブ履歴。曲名・イベント名・会場名・年でインクリメンタル検索 |
| `/lives/[id]` | セットリスト、初披露バッジ、YouTube埋め込み(タイムスタンプ対応)、前後ナビ |
| `/songs`, `/songs/[id]` | 楽曲一覧と演奏履歴・年別チャート・共演曲 |
| `/venues`, `/venues/[slug]` | 会場一覧と会場別の出演履歴 |
| `/stats` | 年別ライブ回数・演奏回数Top10・曲×年ヒートマップ |
| `/picker` | **選曲ノート**(下記) |

⌘Kで曲・ライブ・会場の横断検索(かな正規化あり)。

## 選曲ノート `/picker`

次のライブのセトリを組み、決まったらライブ記録に取り込むまでを1ページで行う。

- **曲を探す**: 全294曲(未演奏含む)。曲名・収録CD名の検索、ディスコグラフィから辿る、
  シングル/カップリング/紅白/タイアップ/バラード/演奏状況/四季(春夏冬)で絞り込み
- **方向性**: テンポ(バランス/攻め/しっとり)×知名度(一般ウケ/半々/コア掘り)の
  全16通りの適合度を表で見比べて選ぶ。選ぶと「おすすめ順 ✨」が効く
- **メンバーの希望曲**: 7人(可変)。♥で登録し、全員の希望が1曲以上入っているかを可視化
- **セトリ案の提案**: 3パターン(希望優先/方向性重視/定番中心)。確定曲は残し、
  **絞り込み中の曲から**選ぶ
- **セトリ**: ライブ単位で複数管理。曲順・確定フラグあり
- **曲の特徴をその場で修正**: テンポ/バラード/BPMのバッジを押すと直せる(BPMバッジからも開ける)。
  直した内容は**その場で全メンバーに共有される**。「曲データに保存」で
  `data/song_attributes.yml` に書き戻ると、全員ぶんの未保存の直しが消える

## データ

`data/*.yml` をビルド時に読み込み、参照整合性を検証する(不整合はビルド失敗)。
`src/lib/data.ts` がファイルの更新時刻を見てキャッシュを捨てるので、
YAMLを書き換えれば**開発サーバーの再起動なしで**反映される。

| ファイル | 内容 | 出典 |
| --- | --- | --- |
| `lives.yml` | ライブ93本 | v2から移行 + 手入力 |
| `setlists.yml` | 演奏記録 | 同上 |
| `songs.yml` / `albums.yml` / `album_tracks.yml` | 全294曲のディスコグラフィ | 旧手動DB(`data/raw/`)+ iTunes |
| `song_attributes.yml` | tempo / ballad / bpm / kouhaku / tieup | **下記の注意を参照** |
| `song_seasons.yml` | 春夏冬タグ | aiko公式Spotifyプレイリスト |
| `members.yml` | メンバー7人と希望曲43件 | ユーザー入力 |

### song_attributes.yml の信頼度(重要)

- `tempo` / `ballad` … **曲を聴かずに付けた推測。誤りがある**。実際に「赤いランプ」「milk」を
  ユーザーに指摘されて修正した。UIから直せるようにしてあるので、指摘されたら直す
- `bpm` … MusicBrainz + AcousticBrainz の解析値を自動取得(`node scripts/fetch-bpm.mjs`)。
  **80曲のみ(演奏実績のある曲の43%)** で、**倍/半分で入っている曲がある**。
  テンポ区分と食い違う値は画面上で赤く表示している
- `kouhaku` / `tieup` … Wikipediaで裏取り済み(紅白15曲・タイアップ67曲)

### BPMについて調査済みのこと(再調査不要)

- Spotify Audio Features: 2024年11月に新規アプリへの提供終了。**使えない**
- Deezer API: aiko本人の曲はヒットするが bpm は全て 0。**使えない**
- MusicBrainz + AcousticBrainz: **これだけ使える**。ただしAcousticBrainzは2022年に
  新規収集を終了しているのでカバレッジはこれ以上伸びない

## 状態の置き場所(重要)

2段構えになっている。ここを取り違えると設計が壊れる。

**作業中の状態 → Durable Object(共有・即時)**
セトリ案、メンバーの希望曲(♥)、曲の特徴の直し。
各自のスマホで触ると全員に即反映される。**GitHubもトークンも要らない**。
→ `workers/picker-room.js` / `src/lib/picker-ops.ts` / `src/components/picker/usePickerSync.ts`

**記録の本体 → `data/*.yml`(リポジトリ)**
確定したライブ記録・曲データ。ここへの書き戻しだけが別経路になる。
`src/lib/setlist-backend.ts` に集約:

1. `local` … `npm run dev` で立つ `scripts/data-server.mjs` が直接更新(開発時)。動作確認済み
2. `github` … GitHub Contents API でコミット。**公開サイトの本命**。
   Worker が secret のトークンで代理コミットするので、利用者は GitHub を意識しない
   (`workers/github-proxy.js`)。**実地確認済み**。
   利用者自身の PAT を使う旧経路も残っているが、設定済みの人にしか効かない
3. `manual` … YAMLをコピー/ダウンロードして手で貼る

## デプロイ

**Cloudflare Workers**。手順・選定理由・無料枠は [`docs/DEPLOY.md`](DEPLOY.md) を読むこと。

- 公開URL: https://nanawa.zinc-echidna.workers.dev(Basic認証。ユーザー名・パスワードとも共有)
- `out/` を静的アセットとして配信し、その手前に Worker で Basic 認証をかける
- 選曲ノートの同期は同じ Worker 上の Durable Object
- 認証情報は **secret**。リポジトリが public なので絶対にコミットしない
- `npm run build && npx wrangler deploy` で出る

**Vercel と AWS Amplify の Git 連携が残っていたが停止済み**。
そちらに出ると Basic 認証も同期も効かない裸のコピーが公開されてしまうため。
Vercel は `vercel.json` の `git.deploymentEnabled: false`、Amplify は
GitHub の webhook 3つを無効化(削除ではないので戻せる)。

## 残っている宿題

- [ ] **コミットしたデータを自動でサイトに反映する**(最優先。下記「反映されるまでの経路」)

## 反映されるまでの経路(注意)

「曲データに保存」を押すと **Worker が代理でコミットする**(利用者は GitHub を意識しない)。
ただし **コミットしただけではサイトに反映されない**。

`wrangler deploy` は手元でビルドした `out/` を上げるだけで、
リポジトリへの push では何も起きない(GitHub Actions も webhook も無い)。
今は誰かが手で `npm run build && npx wrangler deploy` する必要がある。

そのため直しは**保存時には消さず、配信中のデータが追いついた時点で自動的に引退する**
作りにしてある。これが無いと「保存したのに画面が元に戻った」ように見える。

**やるべきこと**: Cloudflare ダッシュボードで Workers Builds を接続し、
`main` への push で `npm run build && npx wrangler deploy` が走るようにする。
→ Worker の Settings → Builds → Connect。API では有効化できないので手作業。
GitHub Actions でも代替できるが、その場合は Cloudflare の API トークンを
GitHub の secret に置く必要があり、扱う鍵が増える。

## 見送ると決めたこと

- **秋の季節タグ** … aiko公式Spotifyプレイリストが春夏冬しかなく、出典が無い。
  推測で付けるとテンポ/バラードと同じ「当てにならないデータ」が増えるだけなので付けない
- **利用者ごとの GitHub PAT** … 選曲に来たメンバーにトークンを作らせるのは筋が悪いのでやめた。
  **Worker が secret として持つトークン1本で代理コミットする**方式に置き換え済み
  (`workers/github-proxy.js`)。実際にコミットが作られるところまで検証済み
- **`tempo` / `ballad` / BPM の精度** … ユーザーが自分で入力して直す。宿題として持たない

## 作業の進め方(ユーザーの希望)

- 自走する。確認で止まらない(破壊的操作は除く)
- git-flow。issueを切って `feature/*` ブランチ、コミットは細かく、日本語メッセージ
  (`add:` / `fix:` / `clean:` / `docs:`)、`--no-ff` で develop にマージ
- 重い調査は Sonnet のサブエージェントに投げてコストを抑える

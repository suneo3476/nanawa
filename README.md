# 七輪ライブラリー v3

aikoコピーバンド「七輪」のライブ出演記録とセットリストのアーカイブサイト。
「この曲やった? いつ? どこで?」に最短で答えることを最大の価値に据えた第3版です。

## 主な機能

- **ライブ履歴ブラウザ** (`/`) — 曲名・イベント名・会場名・年でのインクリメンタル検索。年別グルーピング、動画ありフィルタ
- **ライブ詳細** (`/lives/[id]`) — セットリスト、初披露バッジ、曲ごとのYouTube演奏動画(タイムスタンプ対応)、前後ライブへのナビ
- **楽曲** (`/songs`, `/songs/[id]`) — 演奏回数・最近やった順・ごぶさた順の並べ替え、年別スパークライン、全演奏履歴、よく一緒に演奏された曲
- **会場** (`/venues`) — 出演会場の一覧と会場ごとの出演履歴
- **統計** (`/stats`) — 年別ライブ回数、演奏回数Top10、曲×年ヒートマップ
- **選曲ノート** (`/picker`) — 選曲会議のたたき台。未演奏曲も含む全ディスコグラフィから選曲でき、テンポ(アップ/ミドル/スロー)とバラードの構成を見ながら「バランス型/フェス攻め型/しっとり型」の方向性に対する適合度スコアリングと「次に足すといい曲」の提案。候補リスト作成(この端末に自動保存)、リンク/テキストでの共有、iTunes 30秒試聴(曲名完全一致のみ)、Spotify / YouTube Music へのリンク
- **⌘K 検索パレット** — 全ページから曲・ライブ・会場を横断検索(ひらがな/カタカナ正規化対応)

## 技術構成

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- `output: "export"` による完全静的出力 — `out/` をそのまま静的ホスティングへ
- データは `data/*.yml` をビルド時に読み込み・検証(参照整合性エラーはビルド失敗になる)

## 開発

```bash
npm install
npm run dev    # 開発サーバー http://localhost:3000
npm run build  # 静的ビルド (out/ に出力)
npm run lint
```

## データの更新(ライブを追加する)

1. `data/lives.yml` にライブを追加(`id` は `liveXXX` 連番、`date` は `YYYY-MM-DD`)
2. `data/setlists.yml` に演奏曲を追加(`liveId` / `songId` / `order` / `type: individual|medley` / `youtubeUrl`)
3. 新曲は `data/songs.yml` に追加(aikoの全ディスコグラフィは取り込み済み。原盤データは `data/raw/`、再取り込みは `node scripts/import-catalog.mjs`)
4. 曲のテンポ/バラード属性は `data/song_attributes.yml` で編集(現状はClaudeによる暫定値)
5. `npm run build` — データ不整合(存在しないID参照など)はここでエラーとして検出されます

## 経緯

- v1 (`study/nanawa`) → v2 (`study/nanawa-plus`, [LTスライド](https://speakerdeck.com/suneo3476/qi-lun-raiburari-claude-ai-dezuo-ru-next-dot-js-apuri)) → v3 (本リポジトリ)
- v2からの主な改善: ライブ一覧ページの新設(v2には存在しなかった)、検索フィルタの完全実装(v2ではキーワード/会場/年が未実装)、楽曲ページの演奏履歴リスト実装、選曲ノートの追加

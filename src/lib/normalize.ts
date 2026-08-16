// 検索用のテキスト正規化。クライアント/サーバー両方から使う。
// NFKC 正規化 → 小文字化 → カタカナをひらがなへ → 空白除去。
// 「ボーイフレンド」を「ぼーいふれんど」でも「ボーイフレンド」でも
// 引けるようにするのが目的。

export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60),
    )
    .replace(/\s+/g, "");
}

/** クエリを空白区切りのAND条件として、正規化済みターゲットに全語含まれるか */
export function matchesQuery(normalizedTarget: string, query: string): boolean {
  const terms = query
    .normalize("NFKC")
    .split(/\s+/)
    .filter(Boolean)
    .map(normalizeForSearch);
  if (terms.length === 0) return true;
  return terms.every((t) => normalizedTarget.includes(t));
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 pt-24 text-center">
      <p className="font-mono text-5xl font-bold text-accent">404</p>
      <h1 className="text-lg font-bold">ページが見つかりません</h1>
      <p className="max-w-sm text-sm text-muted">
        URLが変わったか、削除された可能性があります。検索(⌘K)か、ライブ履歴から探し直してみてください。
      </p>
      <Link
        href="/"
        className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
      >
        ライブ履歴へ戻る
      </Link>
    </div>
  );
}

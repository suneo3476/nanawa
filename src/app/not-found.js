// src/app/not-found.js (既存のnot-found.tsxを削除後)
export default function NotFound() {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h1 style={{ marginBottom: '1rem' }}>ページが見つかりません</h1>
        <a href="/" style={{ color: 'blue' }}>トップページへ戻る</a>
      </div>
    );
  }
'use client';

export default function Error({error, reset}) {
  return (
    <div style={{textAlign: "center", padding: "2rem"}}>
      <h2 style={{marginBottom: "1rem"}}>エラーが発生しました</h2>
      <p style={{marginBottom: "1rem"}}>申し訳ありませんが、エラーが発生しました。</p>
      <button 
        onClick={() => reset()}
        style={{
          backgroundColor: "#9333ea",
          color: "white",
          padding: "0.5rem 1rem",
          border: "none",
          borderRadius: "0.25rem",
          cursor: "pointer"
        }}
      >
        再試行
      </button>
    </div>
  );
}
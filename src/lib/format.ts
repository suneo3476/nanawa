const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** "2024-12-14" -> "2024.12.14 (土)" */
export function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")} (${WEEKDAYS[day]})`;
}

/** "2024-12-14" -> "2024.12.14" */
export function formatDateShort(date: string): string {
  return date.replaceAll("-", ".");
}

export function yearOf(date: string): number {
  return Number(date.slice(0, 4));
}

export interface YouTubeRef {
  videoId: string;
  start: number | null;
}

/** youtu.be / youtube.com の両形式と t / start パラメータに対応 */
export function parseYouTubeUrl(url: string): YouTubeRef | null {
  if (!url) return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  let videoId = "";
  if (u.hostname === "youtu.be") {
    videoId = u.pathname.slice(1).split("/")[0];
  } else if (u.hostname.endsWith("youtube.com")) {
    if (u.pathname === "/watch") videoId = u.searchParams.get("v") ?? "";
    else if (u.pathname.startsWith("/live/") || u.pathname.startsWith("/embed/"))
      videoId = u.pathname.split("/")[2] ?? "";
  }
  if (!/^[\w-]{6,}$/.test(videoId)) return null;

  const rawStart = u.searchParams.get("start") ?? u.searchParams.get("t");
  let start: number | null = null;
  if (rawStart) {
    const m = rawStart.match(/^(?:(\d+)h)?(?:(\d+)m)?(\d+)s?$/);
    if (m) {
      start =
        Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
    }
  }
  return { videoId, start };
}

export function youtubeEmbedUrl(ref: YouTubeRef): string {
  const params = new URLSearchParams({ rel: "0" });
  if (ref.start) params.set("start", String(ref.start));
  return `https://www.youtube.com/embed/${ref.videoId}?${params}`;
}

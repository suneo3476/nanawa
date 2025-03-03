// src/utils/api.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function fetchLives() {
  const res = await fetch(`${BASE_URL}/api/lives`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch lives');
  return res.json();
}

export async function fetchSongs() {
  const res = await fetch(`${BASE_URL}/api/songs`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch songs');
  return res.json();
}

export async function fetchSetlists() {
  const res = await fetch(`${BASE_URL}/api/setlists`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch setlists');
  return res.json();
}

export async function fetchSongData(songId: string) {
  const res = await fetch(`${BASE_URL}/api/songs/${songId}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error('Failed to fetch song data');
  return res.json();
}

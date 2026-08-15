import {
  combinedFit,
  directionAffinity,
  emptyComposition,
  wishFit,
  type Composition,
} from "./scoring";
import type { Tempo } from "./types";

/** 提案アルゴリズムが必要とする曲の情報だけを持つ最小の型 */
export interface SuggestSong {
  id: string;
  title: string;
  tempo: Tempo | null;
  fameTier: 1 | 2 | 3;
  playCount: number;
  /** 最終演奏からのライブ本数。未演奏は null */
  livesSinceLast: number | null;
}

export interface SuggestMember {
  id: string;
  name: string;
  wishes: string[];
}

export interface SuggestOptions {
  songs: SuggestSong[];
  members: SuggestMember[];
  size: number;
  tempoTarget: Record<Tempo, number> | null;
  fameTarget: number | null;
  /** 既に確定している曲(必ず含める) */
  locked?: string[];
}

export interface Suggestion {
  key: "wish" | "balanced" | "standard";
  label: string;
  description: string;
  songIds: string[];
  fit: number | null;
  wish: number | null;
  composition: Composition;
}

function compositionOf(songs: SuggestSong[]): Composition {
  const comp = emptyComposition();
  for (const s of songs) {
    if (s.tempo) comp.counts[s.tempo]++;
    else comp.tempoUnknown++;
    if (s.fameTier <= 2) comp.famous++;
    comp.total++;
  }
  return comp;
}

/**
 * 貪欲法で1曲ずつ足していく。
 * 各ステップで「方向性の適合度」と「まだ希望が満たせていないメンバーの救済」を
 * 合わせた得点が最も高い曲を選ぶ。weights で性格づけを変える。
 */
function greedyPick(
  opts: SuggestOptions,
  weights: { fit: number; wish: number; popularity: number; gap: number },
  seed: string[],
): string[] {
  const { songs, members, size, tempoTarget, fameTarget } = opts;
  const byId = new Map(songs.map((s) => [s.id, s]));
  const chosen: string[] = [...seed];
  const chosenSet = new Set(chosen);

  const maxPlayCount = Math.max(1, ...songs.map((s) => s.playCount));
  const maxGap = Math.max(
    1,
    ...songs.map((s) => s.livesSinceLast ?? Number.MAX_SAFE_INTEGER / 2),
  );

  while (chosen.length < size) {
    const currentSongs = chosen.map((id) => byId.get(id)!).filter(Boolean);
    const baseComp = compositionOf(currentSongs);
    const baseFit = combinedFit(baseComp, tempoTarget, fameTarget) ?? 0;
    // まだ希望が1曲も入っていないメンバーの希望曲
    const unmet = new Set<string>();
    for (const m of members) {
      if (m.wishes.length === 0) continue;
      if (m.wishes.some((w) => chosenSet.has(w))) continue;
      for (const w of m.wishes) unmet.add(w);
    }

    let best: { id: string; score: number } | null = null;
    for (const song of songs) {
      if (chosenSet.has(song.id)) continue;

      let score = 0;
      if (tempoTarget || fameTarget !== null) {
        const next = compositionOf([...currentSongs, song]);
        score +=
          weights.fit * ((combinedFit(next, tempoTarget, fameTarget) ?? 0) - baseFit);
        // 目標に近づく量だけだと、構成が目標から大きく外れているときに
        // どの方向性でも同じ曲が選ばれてしまうので、方向性そのものへの
        // 近さ(例: 攻めならアップ、コア掘りならコア曲)も加える
        const affinity = directionAffinity(song, tempoTarget, fameTarget);
        if (affinity !== null) score += weights.fit * affinity * 0.1;
      }
      if (unmet.has(song.id)) score += weights.wish;
      score += weights.popularity * (song.playCount / maxPlayCount) * 10;
      score +=
        weights.gap *
        ((song.livesSinceLast ?? maxGap) / maxGap) *
        10;

      if (!best || score > best.score) best = { id: song.id, score };
    }
    if (!best) break;
    chosen.push(best.id);
    chosenSet.add(best.id);
  }
  return chosen;
}

function summarize(
  key: Suggestion["key"],
  label: string,
  description: string,
  songIds: string[],
  opts: SuggestOptions,
): Suggestion {
  const byId = new Map(opts.songs.map((s) => [s.id, s]));
  const comp = compositionOf(songIds.map((id) => byId.get(id)!).filter(Boolean));
  return {
    key,
    label,
    description,
    songIds,
    fit: combinedFit(comp, opts.tempoTarget, opts.fameTarget),
    wish: wishFit(opts.members, new Set(songIds)),
    composition: comp,
  };
}

/**
 * セトリ候補を3パターン提案する。
 * どれも「確定済みの曲」は必ず含み、指定の曲数まで埋める。
 *
 *  - 希望優先: まず全員の希望から1曲ずつ拾い、残りを方向性で埋める
 *  - バランス: 方向性の適合度を最大化しつつ、未充足メンバーも救う
 *  - 定番+希望: 演奏回数の多い定番曲を軸に、希望も混ぜる
 */
export function suggestSetlists(opts: SuggestOptions): Suggestion[] {
  const locked = (opts.locked ?? []).filter((id) =>
    opts.songs.some((s) => s.id === id),
  );
  const size = Math.max(opts.size, locked.length);
  const options = { ...opts, size, locked };

  // --- 1. 希望優先: 各メンバーの希望を1曲ずつ確保してから埋める ---
  const wishSeed = [...locked];
  const seen = new Set(wishSeed);
  const membersWithWishes = opts.members.filter((m) => m.wishes.length > 0);
  for (const m of membersWithWishes) {
    if (wishSeed.length >= size) break;
    if (m.wishes.some((w) => seen.has(w))) continue; // 既に満たせている
    // 同じ曲を複数人が希望している場合は、より多くの人を満たせる曲を選ぶ
    const best = [...m.wishes]
      .filter((w) => !seen.has(w) && opts.songs.some((s) => s.id === w))
      .sort(
        (a, b) =>
          membersWithWishes.filter((x) => x.wishes.includes(b)).length -
          membersWithWishes.filter((x) => x.wishes.includes(a)).length,
      )[0];
    if (best) {
      wishSeed.push(best);
      seen.add(best);
    }
  }

  const wishPlan = greedyPick(
    options,
    { fit: 2, wish: 30, popularity: 0.5, gap: 0.3 },
    wishSeed,
  );

  // --- 2. バランス: 方向性重視、希望はほどほどに ---
  const balancedPlan = greedyPick(
    options,
    { fit: 5, wish: 12, popularity: 0.4, gap: 0.6 },
    locked,
  );

  // --- 3. 定番+希望: よく演奏している曲を軸に ---
  const standardPlan = greedyPick(
    options,
    { fit: 2, wish: 10, popularity: 3, gap: 0 },
    locked,
  );

  return [
    summarize(
      "wish",
      "みんなの希望優先",
      "全員の希望曲が1曲以上入ることを最優先にした案",
      wishPlan,
      options,
    ),
    summarize(
      "balanced",
      "方向性重視",
      "選んだ方向性(テンポ・知名度)への適合度を優先しつつ希望も拾う案",
      balancedPlan,
      options,
    ),
    summarize(
      "standard",
      "定番中心",
      "演奏回数の多い手慣れた曲を軸にした案",
      standardPlan,
      options,
    ),
  ];
}

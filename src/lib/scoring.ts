import type { Tempo } from "./types";

export type TempoDirKey = "none" | "balance" | "attack" | "mellow";
export type FameDirKey = "none" | "mass" | "half" | "core";

export const TEMPO_DIRS: {
  key: TempoDirKey;
  label: string;
  short: string;
  target: Record<Tempo, number> | null;
}[] = [
  { key: "none", label: "指定なし", short: "—", target: null },
  {
    key: "balance",
    label: "バランス型",
    short: "バランス",
    target: { up: 0.4, mid: 0.35, slow: 0.25 },
  },
  {
    key: "attack",
    label: "フェス攻め型",
    short: "攻め",
    target: { up: 0.6, mid: 0.3, slow: 0.1 },
  },
  {
    key: "mellow",
    label: "しっとり型",
    short: "しっとり",
    target: { up: 0.15, mid: 0.35, slow: 0.5 },
  },
];

export const FAME_DIRS: {
  key: FameDirKey;
  label: string;
  short: string;
  target: number | null;
}[] = [
  { key: "none", label: "指定なし", short: "—", target: null },
  { key: "mass", label: "一般ウケ重視", short: "一般ウケ", target: 0.75 },
  { key: "half", label: "半々", short: "半々", target: 0.5 },
  { key: "core", label: "コア掘り", short: "コア", target: 0.25 },
];

export interface Composition {
  counts: Record<Tempo, number>;
  tempoUnknown: number;
  ballads: number;
  /** fameTier 1-2 の曲数 */
  famous: number;
  total: number;
}

export const emptyComposition = (): Composition => ({
  counts: { up: 0, mid: 0, slow: 0 },
  tempoUnknown: 0,
  ballads: 0,
  famous: 0,
  total: 0,
});

/** テンポ構成が目標比率にどれだけ近いか(0〜100)。判定対象ゼロなら null */
export function tempoFit(
  counts: Record<Tempo, number>,
  target: Record<Tempo, number>,
): number | null {
  const total = counts.up + counts.mid + counts.slow;
  if (total === 0) return null;
  let diff = 0;
  for (const k of ["up", "mid", "slow"] as const) {
    diff += Math.abs(counts[k] / total - target[k]);
  }
  return 100 * (1 - diff / 2);
}

/** 有名曲比率が目標にどれだけ近いか(0〜100) */
export function fameFit(
  famous: number,
  total: number,
  target: number,
): number | null {
  if (total === 0) return null;
  return 100 * (1 - Math.abs(famous / total - target));
}

/** 指定した方向性の組み合わせでの適合度。どちらも指定なしなら null */
export function combinedFit(
  comp: Composition,
  tempoTarget: Record<Tempo, number> | null,
  fameTarget: number | null,
): number | null {
  const parts: number[] = [];
  if (tempoTarget) {
    const t = tempoFit(comp.counts, tempoTarget);
    if (t !== null) parts.push(t);
  }
  if (fameTarget !== null) {
    const f = fameFit(comp.famous, comp.total, fameTarget);
    if (f !== null) parts.push(f);
  }
  if (parts.length === 0) return null;
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

/**
 * 曲そのものが「選んだ方向性らしいか」(0〜100)。
 *
 * 適合度の差分(距離がどれだけ縮むか)だけで並べると、いまの構成が目標から
 * 大きく外れているときに、どの方向性を選んでも同じ曲が上位に来てしまう。
 * (例: 有名曲だけの候補なら、目標が「一般ウケ」でも「コア掘り」でも
 *  コア曲を足すのが同じだけ距離を縮めるため区別がつかない)
 * そこで「目標比率そのもの」を曲の好ましさとして加える。
 */
export function directionAffinity(
  song: { tempo: Tempo | null; fameTier: 1 | 2 | 3 },
  tempoTarget: Record<Tempo, number> | null,
  fameTarget: number | null,
): number | null {
  const parts: number[] = [];
  if (tempoTarget && song.tempo) {
    // 目標比率が高いテンポほど好ましい(最大値で正規化して 0〜1 に)
    const max = Math.max(tempoTarget.up, tempoTarget.mid, tempoTarget.slow);
    parts.push(max > 0 ? tempoTarget[song.tempo] / max : 0);
  }
  if (fameTarget !== null) {
    const famous = song.fameTier <= 2;
    parts.push(famous ? fameTarget : 1 - fameTarget);
  }
  if (parts.length === 0) return null;
  return (parts.reduce((a, b) => a + b, 0) / parts.length) * 100;
}

/** 希望曲が候補に1曲以上入っているメンバーの割合(0〜100) */
export function wishFit(
  members: { wishes: string[] }[],
  pickedIds: Set<string>,
): number | null {
  const withWishes = members.filter((m) => m.wishes.length > 0);
  if (withWishes.length === 0) return null;
  const satisfied = withWishes.filter((m) =>
    m.wishes.some((w) => pickedIds.has(w)),
  ).length;
  return Math.round((satisfied / withWishes.length) * 100);
}

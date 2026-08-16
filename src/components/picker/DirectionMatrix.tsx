"use client";

import {
  combinedFit,
  FAME_DIRS,
  TEMPO_DIRS,
  type Composition,
  type FameDirKey,
  type TempoDirKey,
} from "@/lib/scoring";

/**
 * テンポ×知名度の全組み合わせについて、今の候補リストの適合度を一覧表示する。
 * ユーザーはこの表を見てから方向性(=どのセトリを目指すか)を選べる。
 */
export function DirectionMatrix({
  comp,
  tempoDir,
  fameDir,
  onSelect,
}: {
  comp: Composition;
  tempoDir: TempoDirKey;
  fameDir: FameDirKey;
  onSelect: (tempo: TempoDirKey, fame: FameDirKey) => void;
}) {
  const empty = comp.total === 0;
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-center text-[11px]">
        <caption className="sr-only">
          テンポと知名度の方向性の組み合わせごとの適合度。選ぶとその方向性に切り替わります。
        </caption>
        <thead>
          <tr>
            <th className="p-1 text-left font-normal text-muted">
              <span className="block">テンポ＼</span>
              <span className="block">知名度</span>
            </th>
            {FAME_DIRS.map((f) => (
              <th key={f.key} className="p-1 font-medium text-muted">
                {f.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TEMPO_DIRS.map((t) => (
            <tr key={t.key}>
              <th className="p-1 text-left font-medium text-muted">{t.short}</th>
              {FAME_DIRS.map((f) => {
                const score = combinedFit(comp, t.target, f.target);
                const selected = tempoDir === t.key && fameDir === f.key;
                const label =
                  t.key === "none" && f.key === "none"
                    ? "—"
                    : score === null
                      ? "—"
                      : score;
                return (
                  <td key={f.key} className="p-0.5">
                    <button
                      type="button"
                      onClick={() => onSelect(t.key, f.key)}
                      aria-pressed={selected}
                      aria-label={`テンポ${t.label} × 知名度${f.label}${
                        score !== null ? ` 適合度${score}点` : ""
                      }`}
                      className={`w-full rounded-md py-1.5 font-mono text-[11px] tabular-nums transition-colors ${
                        selected
                          ? "bg-accent font-bold text-white"
                          : "hover:bg-surface-2"
                      }`}
                      style={
                        !selected && typeof label === "number"
                          ? {
                              background: `color-mix(in oklab, var(--accent) ${Math.max(0, (label - 40) * 1.4)}%, var(--surface-2))`,
                            }
                          : undefined
                      }
                    >
                      {label}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
        {empty
          ? "候補に曲を入れると、各組み合わせの適合度(100点満点)がこの表に出ます。目指したいマスを選んでください。"
          : "数字は今の候補リストがその方向性にどれだけ合っているか(100点満点)。マスを選ぶと、その方向性に近づく曲が「おすすめ順 ✨」で上位に来ます。"}
      </p>
    </div>
  );
}

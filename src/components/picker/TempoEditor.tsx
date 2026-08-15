"use client";

import { useEffect, useRef, useState } from "react";
import type { Tempo } from "@/lib/types";
import { TEMPO_CLASS, TEMPO_LABEL } from "@/components/SongBadges";

const TEMPOS: Tempo[] = ["up", "mid", "slow"];

/**
 * テンポ/バラードのその場編集。
 * 初期値は曲を聴かずに付けた推測なので、気づいた人がすぐ直せるようにする。
 */
/**
 * BPMがテンポ区分と食い違っていないか。
 * AcousticBrainz の解析値は倍/半分で出ることがあるので、その手掛かりにする。
 */
export function bpmLooksOff(tempo: Tempo | null, bpm: number | null): boolean {
  if (!tempo || bpm == null) return false;
  if (tempo === "slow" && bpm >= 130) return true;
  if (tempo === "up" && bpm <= 95) return true;
  return false;
}

export function TempoEditor({
  tempo,
  ballad,
  bpm,
  edited,
  onChange,
}: {
  tempo: Tempo | null;
  ballad: boolean | null;
  bpm: number | null;
  /** 未保存の変更があるか */
  edited: boolean;
  onChange: (next: { tempo: Tempo; ballad: boolean; bpm: number | null }) => void;
}) {
  const [open, setOpen] = useState(false);
  // 下に余白が無いときは上向きに開く(一覧の最下段で見切れないように)
  const [placement, setPlacement] = useState<"down" | "up">("down");
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const base =
    "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium leading-none transition-colors";

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!open) {
            const rect = ref.current?.getBoundingClientRect();
            const POPOVER_HEIGHT = 190;
            const below = rect ? window.innerHeight - rect.bottom : 0;
            const above = rect ? rect.top : 0;
            setPlacement(below < POPOVER_HEIGHT && above > below ? "up" : "down");
          }
          setOpen(!open);
        }}
        aria-expanded={open}
        aria-label={
          tempo
            ? `テンポ: ${TEMPO_LABEL[tempo]} (押すと直せます)`
            : "テンポ未設定 (押すと設定できます)"
        }
        title={tempo ? "テンポを直す" : "テンポを設定する"}
        className={
          tempo
            ? `${base} ${TEMPO_CLASS[tempo]} ${edited ? "ring-1 ring-accent" : ""}`
            : `${base} text-muted/70 hover:text-accent-strong`
        }
      >
        {tempo ? TEMPO_LABEL[tempo] : "テンポ不明"}
        {edited && <span className="ml-0.5 text-accent">*</span>}
      </button>

      {open && (
        <>
          <span
            className="fixed inset-0 z-40 cursor-default"
            aria-hidden
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <span
            className={`absolute left-0 z-50 block w-44 rounded-lg border border-border bg-surface p-2 shadow-xl ${
              placement === "up" ? "bottom-5" : "top-5"
            }`}
          >
            <span className="mb-1 block text-[10px] text-muted">
              聴いた感じで直してください
            </span>
            <span className="flex gap-1">
              {TEMPOS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange({ tempo: t, ballad: ballad ?? false, bpm });
                  }}
                  className={`flex-1 rounded px-1 py-1 text-[11px] font-medium transition-colors ${
                    tempo === t
                      ? "bg-accent text-white"
                      : "bg-surface-2 text-muted hover:text-foreground"
                  }`}
                >
                  {TEMPO_LABEL[t]}
                </button>
              ))}
            </span>
            <label className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted">
              <input
                type="checkbox"
                checked={ballad === true}
                onChange={(e) => {
                  if (!tempo) return;
                  onChange({ tempo, ballad: e.target.checked, bpm });
                }}
                disabled={!tempo}
                className="h-3 w-3 accent-[var(--accent)]"
              />
              バラード
            </label>
            <label className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted">
              BPM
              <input
                type="number"
                min={30}
                max={300}
                value={bpm ?? ""}
                placeholder="—"
                onChange={(e) => {
                  if (!tempo) return;
                  const v = e.target.value;
                  onChange({
                    tempo,
                    ballad: ballad ?? false,
                    bpm: v === "" ? null : Number(v),
                  });
                }}
                disabled={!tempo}
                className="w-16 rounded border border-border bg-background px-1.5 py-0.5 tabular-nums outline-none focus:border-accent"
              />
              {bpm != null && bpmLooksOff(tempo, bpm) && (
                <span className="text-[10px] text-[#9b2b2b] dark:text-[#e59a9a]">
                  倍/半分かも
                </span>
              )}
            </label>
            <p className="mt-1 text-[10px] leading-snug text-muted">
              BPMは自動取得した解析値です。ずれていたら直してください。
            </p>
          </span>
        </>
      )}
    </span>
  );
}

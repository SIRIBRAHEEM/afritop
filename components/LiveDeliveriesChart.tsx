"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";

const W = 320;
const H = 120;
const PAD = 10;

/** Slight upward-biased random walk so the line feels alive. */
function drift(y: number): number {
  return Math.max(16, Math.min(H - 16, y + (Math.random() * 9 - 1.5)));
}

function toPath(ys: number[]): string {
  const step = (W - PAD * 2) / (ys.length - 1);
  return ys
    .map((y, i) => `${i === 0 ? "M" : "L"}${(PAD + i * step).toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
}

function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Live "Deliveries this week" chart for the hero mockup.
 *
 * On mount the line draws itself in from below; then every ~3.4s a new
 * transaction lands — the counter ticks up and the line morphs smoothly to
 * the new data (rAF interpolation, no libraries). Fully theme-aware (ink
 * tokens adapt to dark mode; lime fill stays brand-consistent) and disabled
 * under prefers-reduced-motion.
 */
export function LiveDeliveriesChart() {
  const [ys, setYs] = React.useState<number[]>([]);
  const [total, setTotal] = React.useState(1847);
  const [gained, setGained] = React.useState(0);

  const target = React.useRef<number[]>([]);
  const shown = React.useRef<number[]>([]);
  const raf = React.useRef(0);
  const reduced = React.useRef(false);

  const morph = React.useCallback((from: number[], to: number[], dur = 900) => {
    cancelAnimationFrame(raf.current);
    const t0 = performance.now();
    const frame = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = ease(p);
      const cur = from.map((f, i) => f + (to[i] - f) * e);
      shown.current = cur;
      setYs(cur);
      if (p < 1) raf.current = requestAnimationFrame(frame);
    };
    raf.current = requestAnimationFrame(frame);
  }, []);

  React.useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const initial = [96, 90, 93, 82, 86, 74, 78, 64, 70, 58];
    target.current = initial;
    // Draw-in: the line grows up from the baseline (0ms = instant when the
    // user prefers reduced motion — setState happens inside rAF, never
    // synchronously in the effect).
    morph(initial.map(() => H + 4), initial, reduced.current ? 0 : 1200);

    const id = setInterval(() => {
      // Skip work while the tab is hidden — no pointless animation frames.
      if (document.hidden) return;
      const cur = target.current;
      const next = [...cur.slice(1), drift(cur[cur.length - 1])];
      target.current = next;
      const add = 1 + Math.floor(Math.random() * 4);
      setTotal((t) => t + add);
      setGained((g) => g + add);
      if (reduced.current) {
        shown.current = next;
        setYs(next);
      } else {
        morph(shown.current, next);
      }
    }, 3400);

    return () => {
      clearInterval(id);
      cancelAnimationFrame(raf.current);
    };
  }, [morph]);

  const n = Math.max(ys.length, 2);
  const step = (W - PAD * 2) / (n - 1);
  const lx = PAD + step * (n - 1);
  const ly = ys[ys.length - 1] ?? H / 2;
  const line = ys.length ? toPath(ys) : "";
  const area = ys.length ? `${line} L${W - PAD} ${H} L${PAD} ${H} Z` : "";

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-ink-500">
          Deliveries this week
        </p>
        <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-ink-950">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime-400 opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-lime-400" />
          </span>
          live
        </span>
      </div>

      {/* Animated chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full text-ink-950"
        role="img"
        aria-label="Live chart of deliveries this week"
      >
        {/* Gridlines */}
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={PAD}
            x2={W - PAD}
            y1={H * t}
            y2={H * t}
            stroke="currentColor"
            strokeOpacity={0.14}
            strokeWidth={1}
            strokeDasharray="3 5"
          />
        ))}
        {/* Area fill */}
        {area && <path d={area} fill="var(--color-sun-300)" fillOpacity={0.45} />}
        {/* Line */}
        {line && (
          <path
            d={line}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
        {/* Live end dot — soft ping + crisp core */}
        {ys.length > 0 && (
          <>
            <circle
              cx={lx}
              cy={ly}
              r={9}
              fill="var(--color-sun-300)"
              fillOpacity={0.3}
              className="origin-center animate-ping motion-reduce:animate-none"
              style={{ transformBox: "fill-box" }}
            />
            <circle
              cx={lx}
              cy={ly}
              r={4}
              fill="var(--color-sun-300)"
              stroke="currentColor"
              strokeWidth={2}
            />
          </>
        )}
      </svg>

      {/* Live count */}
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="font-display text-2xl font-bold tabular-nums text-ink-950">
            {total.toLocaleString("en-US")}
          </p>
          <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-ink-500">
            top-ups this week
          </p>
        </div>
        <span className="mb-0.5 inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="size-3.5" aria-hidden="true" />
          +{gained} live
        </span>
      </div>

      {/* Day labels */}
      <div className="mt-2 flex items-center justify-between font-mono text-[11px] font-bold text-ink-500">
        <span>mon</span>
        <span>wed</span>
        <span>fri</span>
        <span>sun</span>
      </div>
    </div>
  );
}

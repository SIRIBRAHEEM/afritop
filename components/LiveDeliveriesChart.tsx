"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";

const W = 320;
const H = 120;
const PAD = 10;
const POLL_MS = 15000;
const CACHE_KEY = "afritop-chart-stats";

interface DeliveryStats {
  weekTotal: number;
  buckets: number[];
  labels: string[];
  live: number;
  allTime: number;
  updatedAt: string;
}

const EMPTY_BUCKETS = [0, 0, 0, 0, 0, 0, 0];

function toPath(ys: number[]): string {
  const step = (W - PAD * 2) / (ys.length - 1);
  return ys
    .map((y, i) => `${i === 0 ? "M" : "L"}${(PAD + i * step).toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
}

function ease(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Map daily counts (oldest → newest) to y coordinates, scaled to the chart. */
function toY(buckets: number[]): number[] {
  const max = Math.max(...buckets, 1);
  return buckets.map((v) => H - PAD - (v / max) * (H - PAD * 2));
}

/**
 * Live "Deliveries this week" chart for the hero — driven by REAL on-site
 * transactions. Polls /api/stats every 15s, morphs the line to the latest
 * daily buckets and tweens the counter.
 *
 * The last stats are cached in localStorage so returning to the site never
 * shows a "cleared" chart: the previous real numbers restore instantly, then
 * a fresh fetch morphs them to the latest state. Pauses while the tab is
 * hidden, resumes with a fresh fetch when it becomes visible, and respects
 * prefers-reduced-motion.
 */
export function LiveDeliveriesChart() {
  const [ys, setYs] = React.useState<number[]>([]);
  const [total, setTotal] = React.useState(0);
  const [live, setLive] = React.useState(0);
  const [labels, setLabels] = React.useState<string[]>(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]);
  const [loaded, setLoaded] = React.useState(false);

  const shown = React.useRef<number[]>([]);
  const totalRef = React.useRef(0);
  const drawn = React.useRef(false);
  const reduced = React.useRef(false);
  const raf = React.useRef(0);
  const numRaf = React.useRef(0);

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

  const tweenNumber = React.useCallback((to: number, dur = 700) => {
    cancelAnimationFrame(numRaf.current);
    const from = totalRef.current;
    if (reduced.current || from === to) {
      totalRef.current = to;
      setTotal(to);
      return;
    }
    const t0 = performance.now();
    const frame = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      const v = Math.round(from + (to - from) * ease(p));
      totalRef.current = v;
      setTotal(v);
      if (p < 1) numRaf.current = requestAnimationFrame(frame);
    };
    numRaf.current = requestAnimationFrame(frame);
  }, []);

  const applyStats = React.useCallback(
    (s: DeliveryStats) => {
      const buckets =
        Array.isArray(s.buckets) && s.buckets.length === 7 ? s.buckets : EMPTY_BUCKETS;
      const next = toY(buckets);
      setLive(s.live);
      if (Array.isArray(s.labels) && s.labels.length === 7) setLabels(s.labels);

      if (reduced.current) {
        shown.current = next;
        setYs(next);
        totalRef.current = s.weekTotal;
        setTotal(s.weekTotal);
      } else if (!drawn.current) {
        // First paint: the line draws itself up from the baseline.
        drawn.current = true;
        morph(next.map(() => H + 4), next, 1200);
        tweenNumber(s.weekTotal, 1200);
      } else {
        // If no shape has been drawn yet (e.g. two fetches resolved before the
        // first frame of the draw-in), fall back to the draw-in start.
        morph(shown.current.length === next.length ? shown.current : next.map(() => H + 4), next);
        tweenNumber(s.weekTotal);
      }
    },
    [morph, tweenNumber],
  );

  React.useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let alive = true;

    // Instantly restore the last real stats (deferred so SSR/hydration stay
    // stable and no setState runs synchronously inside the effect).
    let cached: DeliveryStats | null = null;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as DeliveryStats;
        if (Array.isArray(p.buckets) && p.buckets.length === 7 && typeof p.weekTotal === "number") {
          cached = p;
        }
      }
    } catch {
      /* private mode / corrupt value — start fresh */
    }
    const restore = window.setTimeout(() => {
      if (!alive || !cached) return;
      drawn.current = true; // skip the draw-in — show data immediately
      const next = toY(cached.buckets);
      shown.current = next;
      setYs(next);
      totalRef.current = cached.weekTotal;
      setTotal(cached.weekTotal);
      setLive(cached.live ?? 0);
      if (Array.isArray(cached.labels) && cached.labels.length === 7) setLabels(cached.labels);
      setLoaded(true);
    }, 0);

    const load = async () => {
      try {
        const res = await fetch("/api/stats", { cache: "no-store" });
        if (!res.ok) return;
        const stats = (await res.json()) as DeliveryStats;
        if (!alive) return;
        setLoaded(true);
        applyStats(stats);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(stats));
        } catch {
          /* private mode */
        }
      } catch {
        // Network blip — keep the last known data, never crash the chart.
      }
    };

    void load();
    const id = setInterval(() => {
      if (document.hidden) return;
      void load();
    }, POLL_MS);
    const onVisible = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      alive = false;
      clearTimeout(restore);
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      cancelAnimationFrame(raf.current);
      cancelAnimationFrame(numRaf.current);
    };
  }, [applyStats]);

  const n = Math.max(ys.length, 2);
  const step = (W - PAD * 2) / (n - 1);
  const lx = PAD + step * (n - 1);
  const ly = ys[ys.length - 1] ?? H / 2;
  const line = ys.length ? toPath(ys) : "";
  const area = ys.length ? `${line} L${W - PAD} ${H} L${PAD} ${H} Z` : "";
  const isEmpty = loaded && total === 0;

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
        aria-label="Live chart of real deliveries on Afritop this week"
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
        {isEmpty ? (
          /* No real deliveries yet — a quiet dashed baseline, gently breathing. */
          <line
            x1={PAD}
            x2={W - PAD}
            y1={H - PAD}
            y2={H - PAD}
            stroke="currentColor"
            strokeOpacity={0.3}
            strokeWidth={2}
            strokeDasharray="4 5"
            className="animate-pulse motion-reduce:animate-none"
          />
        ) : (
          <>
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
          </>
        )}
      </svg>

      {/* Empty-state hint */}
      {isEmpty && (
        <p className="mt-2 text-center font-mono text-[11px] font-bold text-ink-400">
          Waiting for the first real delivery. It will light up here live
        </p>
      )}

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
        {/* key={live} re-triggers a small pop whenever new deliveries land */}
        <span
          key={live}
          className="mb-0.5 inline-flex items-center gap-1 animate-pop font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400"
        >
          <TrendingUp className="size-3.5" aria-hidden="true" />
          +{live} live
        </span>
      </div>

      {/* Day labels — real weekday names for the 7 rolling days */}
      <div className="mt-2 flex items-center justify-between font-mono text-[11px] font-bold text-ink-500">
        {labels.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

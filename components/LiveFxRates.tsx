"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const CURRENCIES: { code: string; symbol: string; label: string }[] = [
  { code: "NGN", symbol: "₦1", label: "Nigeria" },
  { code: "GHS", symbol: "GH₵1", label: "Ghana" },
  { code: "KES", symbol: "KSh1", label: "Kenya" },
  { code: "ZAR", symbol: "R1", label: "South Africa" },
];

/**
 * Animated number that transitions smoothly between values.
 */
function AnimatedRate({
  value,
  decimals = 1,
}: {
  value: number;
  decimals?: number;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const display = React.useRef(value);
  const raf = React.useRef(0);

  React.useEffect(() => {
    const from = display.current;
    const to = value;
    const duration = 800;
    let start: number | null = null;

    function tick(t: number) {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = from + (to - from) * eased;
      display.current = current;
      if (ref.current) {
        ref.current.textContent = current.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      }
      if (p < 1) raf.current = requestAnimationFrame(tick);
    }

    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value, decimals]);

  return (
    <span ref={ref} className="tabular-nums">
      {value.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}

export function LiveFxRates() {
  const [rates, setRates] = React.useState<Record<string, number> | null>(null);
  const [error, setError] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const mountedRef = React.useRef(true);

  // Initial load — runs once on mount.
  React.useEffect(() => {
    mountedRef.current = true;
    fetch("/api/fx-rates")
      .then((r) => r.json())
      .then((data) => {
        if (mountedRef.current && data.rates) {
          setRates(data.rates);
          setLastUpdated(new Date());
        }
      })
      .catch(() => {
        if (mountedRef.current) setError(true);
      });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Poll every 60 seconds — uses a ref so we never call setState in the effect.
  const pollRef = React.useRef<ReturnType<typeof setInterval>>(undefined);
  React.useEffect(() => {
    async function poll() {
      try {
        const res = await fetch("/api/fx-rates");
        const data = await res.json();
        if (data.rates) {
          setRates(data.rates);
          setLastUpdated(new Date());
          setError(false);
        }
      } catch {
        /* silent — server may be down */
      }
    }
    pollRef.current = setInterval(poll, 60_000);
    return () => clearInterval(pollRef.current);
  }, []);

  const rateEntries = CURRENCIES.map((c) => ({
    code: c.code,
    symbol: c.symbol,
    rate: rates?.[c.code] ?? 0,
  }));

  return (
    <div className="flex flex-wrap gap-2.5">
      {!rates ? (
        // Skeleton placeholders
        CURRENCIES.map((c) => (
          <span
            key={c.code}
            className="inline-flex items-center gap-1 border-2 border-ink-950 bg-paper px-4 py-2 font-mono text-sm text-ink-950 shadow-hard-sm"
          >
            <span className="inline-block h-4 w-6 animate-pulse bg-ink-200" />
            <span className="text-ink-400">→ $</span>1 ·
            <span className="inline-block h-4 w-16 animate-pulse bg-ink-200" />
          </span>
        ))
      ) : (
        <>
          {rateEntries.map((entry) => (
            <span
              key={entry.code}
              className="group relative border-2 border-ink-950 bg-paper px-4 py-2 font-mono text-sm text-ink-950 shadow-hard-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-hard"
            >
              {entry.code}{" "}
              <span className="text-ink-400">
                → $<span className="text-ink-600">1</span>
              </span>{" "}
              ·{" "}
              {entry.rate > 0 ? (
                <AnimatedRate value={entry.rate} decimals={entry.code === "NGN" ? 0 : 1} />
              ) : (
                "—"
              )}

              {/* Live dot indicator */}
              <span
                className={cn(
                  "absolute -right-1 -top-1 size-2 rounded-full ring-2 ring-paper",
                  error ? "bg-red-400" : "bg-emerald-400",
                )}
                title={
                  error
                    ? "Using cached rates"
                    : lastUpdated
                      ? `Updated ${lastUpdated.toLocaleTimeString()}`
                      : "Loading…"
                }
              />
            </span>
          ))}
        </>
      )}
    </div>
  );
}
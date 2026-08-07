"use client";

import { useEffect, useState } from "react";

/**
 * Birthday-style celebration for a delivered top-up: colorful balloons rise
 * across the viewport while confetti specks drift down. Pure CSS keyframes
 * (see .balloon-rise / .confetti-piece in globals.css), zero dependencies.
 *
 * Mounts only when a receipt is "delivered" and auto-dismisses after ~14s so
 * it never overstays. pointer-events-none so it never blocks clicks, and all
 * animation is disabled under prefers-reduced-motion.
 */

const COLORS = ["#ff5d8f", "#ffb020", "#2f6bff", "#10b981", "#8b5cf6", "#e6ed0a", "#ff4757", "#14b8a6"];

const BALLOONS = [
  { left: "5%", delay: 0, dur: 9.5, size: 34 },
  { left: "15%", delay: 1.6, dur: 12, size: 26 },
  { left: "26%", delay: 0.8, dur: 10.5, size: 30 },
  { left: "37%", delay: 2.4, dur: 13, size: 22 },
  { left: "49%", delay: 0.4, dur: 9, size: 32 },
  { left: "60%", delay: 1.2, dur: 11, size: 26 },
  { left: "71%", delay: 2, dur: 12.5, size: 30 },
  { left: "82%", delay: 0.6, dur: 10, size: 24 },
  { left: "92%", delay: 1.8, dur: 11.5, size: 28 },
];

const CONFETTI = [
  { left: "3%", delay: 0.2, dur: 6.2, color: "#e6ed0a", w: 8, h: 12, round: false },
  { left: "10%", delay: 1.4, dur: 7.5, color: "#2f6bff", w: 7, h: 7, round: true },
  { left: "18%", delay: 0.9, dur: 5.8, color: "#ff5d8f", w: 9, h: 11, round: false },
  { left: "26%", delay: 2.2, dur: 8, color: "#8b5cf6", w: 6, h: 6, round: true },
  { left: "34%", delay: 0.5, dur: 6.8, color: "#10b981", w: 8, h: 13, round: false },
  { left: "42%", delay: 1.8, dur: 7.2, color: "#ffb020", w: 7, h: 7, round: true },
  { left: "50%", delay: 0.1, dur: 6, color: "#ff4757", w: 9, h: 12, round: false },
  { left: "58%", delay: 2.6, dur: 8.2, color: "#14b8a6", w: 6, h: 6, round: true },
  { left: "66%", delay: 1.1, dur: 6.6, color: "#e6ed0a", w: 8, h: 11, round: false },
  { left: "74%", delay: 0.7, dur: 7.8, color: "#2f6bff", w: 7, h: 7, round: true },
  { left: "82%", delay: 2, dur: 6.4, color: "#ff5d8f", w: 9, h: 12, round: false },
  { left: "90%", delay: 1.3, dur: 7.6, color: "#8b5cf6", w: 6, h: 6, round: true },
  { left: "96%", delay: 0.3, dur: 6.9, color: "#10b981", w: 8, h: 12, round: false },
];

function Balloon({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 60 88" fill="none" aria-hidden="true">
      {/* Body */}
      <path
        d="M30 2C13.8 2 2 13.4 2 29.5c0 12.6 7.8 22.4 16.6 26.3 3 1.3 5 4.3 5 7.7v4.5h12.8v-4.5c0-3.4 2-6.4 5-7.7C50.2 51.9 58 42.1 58 29.5 58 13.4 46.2 2 30 2Z"
        fill={color}
      />
      {/* Gloss highlight */}
      <ellipse cx="20" cy="19" rx="6.5" ry="9.5" fill="#ffffff" opacity="0.4" transform="rotate(-16 20 19)" />
      {/* Knot */}
      <path d="M26 68h8l-4 6-4-6Z" fill={color} />
      {/* Wavy string */}
      <path
        className="balloon-string"
        d="M30 74c2 4-2 6 0 10"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BalloonCelebration() {
  const [active, setActive] = useState(true);

  useEffect(() => {
    // Longest balloon run is ~13s + 2.4s delay — give the last ones room to finish.
    const t = window.setTimeout(() => setActive(false), 16_500);
    return () => window.clearTimeout(t);
  }, []);

  if (!active) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      aria-hidden="true"
    >
      {BALLOONS.map((b, i) => (
        <span
          key={`b${i}`}
          className="balloon-rise"
          style={{
            left: b.left,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
          }}
        >
          <Balloon color={COLORS[i % COLORS.length]} size={b.size} />
        </span>
      ))}
      {CONFETTI.map((c, i) => (
        <span
          key={`c${i}`}
          className="confetti-piece"
          style={{
            left: c.left,
            animationDuration: `${c.dur}s`,
            animationDelay: `${c.delay}s`,
            backgroundColor: c.color,
            width: c.w,
            height: c.h,
            borderRadius: c.round ? "9999px" : "2px",
          }}
        />
      ))}
    </div>
  );
}

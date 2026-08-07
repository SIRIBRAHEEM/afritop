import type { ServiceId } from "@/lib/catalog";

/**
 * Colorful flat service icons — self-hosted inline SVG (no external CDN, no
 * attribution, crisp at any size, theme-independent).
 *
 * Each icon carries a signature brand color and a subtle living animation:
 *  - Airtime (blue)     — signal waves pulsing off the phone
 *  - Data (purple)      — a lime satellite orbiting the globe
 *  - Electricity (amber) — a soft glow breathing on the bolt + twinkling spark
 *
 * The .icon-* classes are defined in globals.css and all respect
 * prefers-reduced-motion.
 */
export function ServiceIcon({ id, className }: { id: ServiceId; className?: string }) {
  switch (id) {
    case "airtime":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          {/* Signal waves — pulsing, fully clear of the phone. currentColor =
              dark on the lime tile in light mode, white on black in dark mode. */}
          <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="icon-wave">
            <path d="M18.2 7.6a2.5 2.5 0 0 1 0 3.6" />
          </g>
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="icon-wave"
            style={{ animationDelay: "0.4s" }}
          >
            <path d="M20.2 5.4a6 6 0 0 1 0 7.8" />
          </g>
          {/* Phone body — nudged left so the waves sit beside it */}
          <rect x="4.5" y="1.8" width="12" height="20.4" rx="2.4" fill="#2f6bff" stroke="#0a0a0a" strokeWidth="1.7" />
          {/* Screen */}
          <rect x="6.6" y="4.4" width="7.8" height="13.6" rx="1.2" fill="#ffffff" />
          {/* Lime check — a top-up landed */}
          <path d="M8.9 10.8l1.5 1.5 2.6-2.9" fill="none" stroke="#2f6bff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          {/* Camera + home indicator */}
          <circle cx="10.5" cy="5.7" r="0.7" fill="#0a0a0a" opacity="0.35" />
          <rect x="8.6" y="18.8" width="3.8" height="0.9" rx="0.45" fill="#0a0a0a" opacity="0.35" />
        </svg>
      );
    case "data":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          {/* Satellite orbiting the globe — currentColor keeps it visible on
              both the lime (light) and near-black (dark) tiles. */}
          <g className="icon-orbit" style={{ transformBox: "view-box", transformOrigin: "50% 50%" }}>
            <circle cx="12" cy="3.1" r="1.8" fill="currentColor" stroke="#0a0a0a" strokeWidth="1.2" />
          </g>
          {/* Globe */}
          <circle cx="12" cy="12" r="8" fill="#8b5cf6" stroke="#0a0a0a" strokeWidth="1.7" />
          {/* Equator */}
          <ellipse cx="12" cy="12" rx="8" ry="3.3" fill="none" stroke="#0a0a0a" strokeWidth="1" opacity="0.5" />
          {/* Lime landmasses */}
          <circle cx="15.4" cy="9.7" r="2.1" fill="#e6ed0a" stroke="#0b0b0c" strokeWidth="0.9" />
          <circle cx="13.1" cy="12.9" r="1.3" fill="#e6ed0a" stroke="#0b0b0c" strokeWidth="0.9" />
        </svg>
      );
    case "electricity":
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          {/* Twinkling spark — currentColor for contrast on either theme. */}
          <path
            className="icon-wave"
            d="M18.6 2.4l.55 1.25 1.25.55-1.25.55-.55 1.25-.55-1.25-1.25-.55 1.25-.55z"
            fill="currentColor"
          />
          {/* Bolt with breathing glow */}
          <path
            className="icon-bolt-glow"
            d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"
            fill="#ffb020"
            stroke="#0a0a0a"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

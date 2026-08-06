import { cn } from "@/lib/utils";

/**
 * Afritop logo mark — the "flash bolt": a night-black rounded square with an
 * electric-lime bolt that emits a soft glow and, on a slow cycle, a brief
 * flash ring that expands and fades (inspired by the flash-animation icon).
 *
 * The AFRITOP wordmark is rendered separately by <Logo />. The flash is
 * handled by the .afritop-mark-* classes in globals.css (disabled under
 * prefers-reduced-motion). `light` adds a subtle outline for dark surfaces
 * (footer, CTA block).
 */
export function LogoMark({
  size = 40,
  light = false,
  animate = true,
  className,
}: {
  size?: number;
  light?: boolean;
  animate?: boolean;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={cn("shrink-0", animate && "afritop-mark", className)}
    >
      {/* Night square */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="11"
        fill="#0a0a0a"
        stroke={light ? "rgba(255,255,255,0.22)" : "rgba(10,10,10,0.85)"}
        strokeWidth="2"
      />
      {/* Flash ring — expands + fades on each flash cycle */}
      <circle
        className="afritop-mark-ring"
        cx="24"
        cy="24"
        r="17"
        stroke="#d4ff3f"
        strokeWidth="2.5"
        opacity="0"
      />
      {/* Bolt */}
      <path className="afritop-mark-bolt" d="M26 4 6 28h18l-2 16 20-24h-18l2-16z" fill="#d4ff3f" />
      {/* Flash overlay — brightens the bolt at the flash moment */}
      <path
        className="afritop-mark-bolt-flash"
        d="M26 4 6 28h18l-2 16 20-24h-18l2-16z"
        fill="#ffffff"
        opacity="0"
      />
    </svg>
  );
}

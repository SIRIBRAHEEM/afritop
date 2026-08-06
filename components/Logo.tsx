import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Retro-terminal Afritop logo — a small solid-black square with a white bolt
 * glyph, followed by a clean sans-serif "AFRITOP" wordmark. No fills except
 * solid black and white. `light` switches the wordmark to white for dark
 * surfaces (footer, CTA block).
 */
export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="grid size-9 place-items-center bg-night text-white transition-transform duration-200 group-hover:-translate-y-0.5">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </span>
      <span
        className={cn(
          "font-display text-lg font-bold tracking-tight",
          light ? "text-white" : "text-ink-950",
        )}
      >
        AFRITOP
      </span>
    </Link>
  );
}

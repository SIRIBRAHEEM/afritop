import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/LogoMark";

/**
 * Afritop logo — the animated flash-bolt mark followed by the AFRITOP
 * wordmark in Space Grotesk. `light` switches the wordmark to white and adds
 * a subtle outline to the mark for dark surfaces (footer, CTA block).
 * `animate` pauses the flash (used on payment screens where a periodic
 * flash could read as a system flicker).
 */
export function Logo({
  className,
  light,
  animate = true,
}: {
  className?: string;
  light?: boolean;
  animate?: boolean;
}) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)}>
      <LogoMark
        size={36}
        light={light}
        animate={animate}
        className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:scale-105"
      />
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

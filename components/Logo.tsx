import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Cypherpunk Afritop wordmark — pixel-style "AFRITOP" text in a night-black
 * chip with lime text, 2px black border and hard offset shadow.
 * In dark mode the chip stays black and the text turns lime.
 */
export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center", className)}>
      <span
        className={cn(
          "grid h-11 items-center border-2 border-ink-950 bg-night px-3 shadow-hard-sm transition-transform duration-300 group-hover:-translate-y-0.5",
          light && "shadow-hard-sm",
        )}
      >
        <span className="font-display text-lg font-bold tracking-[0.3em] text-[#d4ff3f]">
          AFRITOP
        </span>
      </span>
    </Link>
  );
}
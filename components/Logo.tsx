import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Brand logo — the official mark image rendered in a clean white chip so it
 * reads well on both the light navbar and the dark footer.
 */
export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center", className)}>
      <span
        className={cn(
          "grid h-10 items-center overflow-hidden rounded-xl bg-white px-2 shadow-sm ring-1 transition-transform duration-300 group-hover:-rotate-2 group-hover:scale-[1.03]",
          light ? "ring-white/15" : "ring-ink-100",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Afritop" className="h-8 w-auto object-contain" />
      </span>
    </Link>
  );
}

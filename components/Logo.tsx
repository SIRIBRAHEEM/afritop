import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Brand logo — the official mark image rendered in a soft white chip (no
 * border/ring) so it reads cleanly on both the light navbar and dark footer.
 */
export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center", className)}>
      <span
        className={cn(
          "grid h-11 items-center overflow-hidden rounded-2xl bg-white px-2.5 shadow-[0_12px_32px_-14px_rgba(23,20,9,0.45)] transition-transform duration-300 group-hover:-rotate-2 group-hover:scale-[1.03]",
          light && "shadow-black/40",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Afritop" className="h-9 w-auto object-contain" />
      </span>
    </Link>
  );
}

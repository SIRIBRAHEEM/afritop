import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="relative grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 shadow-[0_8px_20px_-8px_rgba(43,74,47,0.6)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
        {/* power bolt */}
        <svg viewBox="0 0 24 24" className="size-[18px] text-white" fill="currentColor" aria-hidden="true">
          <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14H4Z" />
        </svg>
        {/* sun accent */}
        <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-sun-400 ring-2 ring-paper" />
      </span>
      <span
        className={cn(
          "font-display text-[1.35rem] font-bold leading-none tracking-tight",
          light ? "text-white" : "text-ink-900",
        )}
      >
        afri<span className={light ? "text-sun-300" : "text-brand-600"}>top</span>
      </span>
    </Link>
  );
}

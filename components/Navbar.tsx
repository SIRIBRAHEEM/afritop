"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/buy", label: "Buy" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#countries", label: "Countries" },
  { href: "/transactions", label: "Transactions" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-ink-100 bg-paper/90 shadow-[0_8px_30px_-18px_rgba(23,20,9,0.35)] backdrop-blur-xl"
          : "border-transparent bg-paper/70 backdrop-blur-md",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => {
            const active = link.href.startsWith("/buy") || link.href.startsWith("/transactions")
              ? pathname.startsWith(link.href)
              : false;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900",
                  active && "bg-brand-50 text-brand-700 hover:bg-brand-50 hover:text-brand-700",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/buy"
            className="hidden rounded-full bg-ink-900 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-ink-900/15 transition-all hover:-translate-y-0.5 hover:bg-ink-800 hover:shadow-xl sm:inline-flex"
          >
            Top up now
          </Link>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid size-10 place-items-center rounded-full text-ink-700 transition-colors hover:bg-ink-100 md:hidden"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h10" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden transition-[max-height,opacity] duration-300 md:hidden",
          open ? "max-h-80 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="space-y-1 border-t border-ink-100 bg-paper px-4 py-3">
          {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className="block rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-100"
          >
              {link.label}
            </Link>
          ))}
          <Link
            href="/buy"
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-xl bg-ink-900 px-4 py-3 text-center text-sm font-bold text-white"
          >
            Top up now
          </Link>
        </div>
      </div>
    </header>
  );
}

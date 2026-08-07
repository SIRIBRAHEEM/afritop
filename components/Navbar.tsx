"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WalletLogin } from "@/components/WalletLogin";
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
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "glass-nav" : "border-b-2 border-transparent bg-paper",
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Pause the flash animation on payment screens. */}
        <Logo animate={!pathname.startsWith("/pay")} />

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
                  "border-b-2 border-transparent px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:text-ink-950",
                  active && "border-ink-950 text-ink-950",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          <ThemeToggle />
          <WalletLogin />
          <Link
            href="/buy"
            className="btn-cta hidden border-2 border-ink-950 bg-night px-5 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-ink-800 sm:inline-flex"
          >
            Top up now
          </Link>

          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid size-10 place-items-center border-2 border-ink-950 text-ink-700 transition-colors hover:bg-ink-100 md:hidden"
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
        <div className="space-y-1 border-b-2 border-ink-950 bg-paper px-4 py-3">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block border-2 border-ink-950 px-4 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-100"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/buy"
            onClick={() => setOpen(false)}
            className="btn-cta mt-2 block border-2 border-ink-950 bg-night px-4 py-3 text-center text-sm font-medium text-white"
          >
            Top up now
          </Link>
        </div>
      </div>
    </header>
  );
}
import Link from "next/link";
import { Logo } from "@/components/Logo";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Services",
    links: [
      { label: "Buy airtime", href: "/buy" },
      { label: "Data bundles", href: "/buy" },
      { label: "Electricity tokens", href: "/buy" },
      { label: "Transactions", href: "/transactions" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Countries", href: "/#countries" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of service", href: "/terms" },
      { label: "Privacy policy", href: "/privacy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-ink-950 text-ink-300">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo light />
            <p className="mt-4 text-sm leading-relaxed text-ink-400">
              Airtime, data and prepaid electricity for Nigeria, Ghana, Kenya and
              South Africa — paid in USDC, delivered in seconds.
            </p>
            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-ink-800 bg-ink-900/60 px-3.5 py-2.5 text-xs text-ink-400">
              <svg viewBox="0 0 24 24" className="size-4 text-sun-400" fill="currentColor" aria-hidden="true">
                <path d="M12 2a5 5 0 0 0-5 5v2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 7h6v2H9V9Zm3-5a3 3 0 0 1 3 3v2H9V7a3 3 0 0 1 3-3Z" />
              </svg>
              Payments secured by <span className="font-semibold text-ink-200">Circle · USDC</span>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink-200">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-400 transition-colors hover:text-sun-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-ink-800 pt-6 text-xs text-ink-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Afritop. All rights reserved.</p>
          <p>
            Airtime via <span className="text-ink-300">Africa&apos;s Talking</span> · Settlement in{" "}
            <span className="text-ink-300">USDC</span> via Circle
          </p>
        </div>
      </div>
    </footer>
  );
}

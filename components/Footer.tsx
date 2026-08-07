import Link from "next/link";
import { Logo } from "@/components/Logo";

const COLUMNS: { title: string; links: { label: string; href: string; external?: boolean }[] }[] = [
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
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Arc docs", href: "https://docs.arc.io/", external: true },
      { label: "Circle docs", href: "https://developers.circle.com/", external: true },
      { label: "ArcScan explorer", href: "https://testnet.arcscan.app/", external: true },
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
    <footer className="border-t-2 border-ink-950 bg-night text-white/70">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <Logo light />
            <p className="mt-4 text-sm leading-relaxed text-white/55">
              Airtime, data and prepaid electricity for Nigeria, Ghana, Kenya and
              South Africa — paid in USDC, delivered in seconds.
            </p>
            <div className="mt-5 flex items-center gap-2 border-2 border-ink-950 bg-white/10 px-3.5 py-2.5 text-xs text-white/70">
              <svg viewBox="0 0 24 24" className="size-4 text-white" fill="currentColor" aria-hidden="true">
                <path d="M12 2a5 5 0 0 0-5 5v2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 7h6v2H9V9Zm3-5a3 3 0 0 1 3 3v2H9V7a3 3 0 0 1 3-3Z" />
              </svg>
              Payments secured by <span className="font-semibold text-white/85">Circle · USDC</span>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/85">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-sun-300"
                      >
                        {link.label}
                        <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M7 17 17 7M8 7h9v9" />
                        </svg>
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-white/55 transition-colors hover:text-sun-300"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 pt-8 text-xs text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} Afritop. All rights reserved.</p>
          <p className="text-center sm:text-right">
            Airtime via{" "}
            <a
              href="https://africastalking.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 underline underline-offset-2 transition-colors hover:text-sun-300"
            >
              Africa&apos;s Talking
            </a>
            · Settlement in{" "}
            <span className="text-white/70">USDC</span> via Circle
          </p>
          <a
            href="https://x.com/siribraheem33"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 border-2 border-ink-950 bg-white/10 px-4 py-2 font-medium text-white/85 transition-all hover:-translate-y-0.5 hover:bg-white/15 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="size-3.5 text-white" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644Z" />
            </svg>
            Built by Siribraheem
          </a>
        </div>
      </div>
    </footer>
  );
}

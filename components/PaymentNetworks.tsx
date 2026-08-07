import Link from "next/link";
import { WALLET_INSTALLS } from "@/lib/web3";
import { BrandMark } from "@/components/BrandMark";

/**
 * "Supported payment networks" trust section.
 *
 * Tells users — before they ever connect a wallet — which wallets and
 * networks AfriTop supports: 4 EVM wallets (EIP-6963 discovery), USDC on
 * Arc (Circle's stablecoin L1), plus the trust signals (self-custody, no
 * card, on-chain receipts).
 */
const WALLET_LINKS: { name: string; url: string; color: string; short: string }[] =
  WALLET_INSTALLS.map((w) => ({
    name: w.name,
    url: w.url,
    color: w.color,
    short: w.name.replace(" Wallet", ""),
  }));

const TRUST_POINTS: {
  title: string;
  text: string;
  color: string; // vibrant accent tile — theme-independent, like ServiceIcon
  icon: "lock" | "card" | "check";
}[] = [
  {
    title: "Self-custody",
    text: "USDC never leaves your wallet until you approve the exact amount. We never hold your funds.",
    color: "#10b981",
    icon: "lock",
  },
  {
    title: "No card needed",
    text: "Pay with stable USDC from any EVM wallet — no bank card, no KYC, no hidden exchange margins.",
    color: "#f97316",
    icon: "card",
  },
  {
    title: "On-chain verified",
    text: "Every payment settles on Arc and is confirmed on-chain before your top-up is delivered.",
    color: "#65a30a",
    icon: "check",
  },
];

export function PaymentNetworks() {
  return (
    <section
      id="networks"
      className="relative overflow-hidden scroll-mt-20 border-b-2 border-ink-950 bg-paper py-20 sm:py-24"
    >
      <span
        className="liquid-blob"
        style={{ background: "radial-gradient(circle, rgba(16,185,129,0.8), rgba(16,185,129,0.16))", width: 340, height: 340, right: -110, top: "20%", opacity: 0.2, animationDelay: "6s" }}
        aria-hidden="true"
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-widest text-ink-500">
              How you pay
            </p>
            <h2 className="mt-3 font-display text-4xl font-bold text-ink-950 sm:text-5xl">
              Supported payment networks
            </h2>
          </div>
          <p className="max-w-xs text-sm text-ink-500">
            Connect any of these wallets — we detect what&apos;s installed and
            settle in USDC on Arc.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* ── Wallets ── */}
          <div className="glass p-7 sm:p-8">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xl font-bold text-ink-950">
                Works with your wallet
              </h3>
              <span className="border-2 border-ink-950 bg-paper px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-950">
                EIP-6963
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              Install any of these and we&apos;ll detect it automatically when you
              check out — no accounts, no sign-ups.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {WALLET_LINKS.map((w) => (
                <Link
                  key={w.name}
                  href={w.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 border-2 border-ink-950 bg-paper px-3.5 py-3 transition-all duration-200 hover:-translate-y-1 hover:bg-brand-50"
                >
                  <BrandMark
                    logo={
                      w.name === "MetaMask"
                        ? "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
                        : `https://www.google.com/s2/favicons?domain=${w.name
                            .toLowerCase()
                            .includes("coinbase")
                            ? "coinbase.com"
                            : w.name.toLowerCase().includes("trust")
                              ? "trustwallet.com"
                              : "rabby.io"}&sz=128`
                    }
                    name={w.name}
                    short={w.short}
                    color={w.color}
                    size={34}
                    className="transition-transform duration-200 group-hover:scale-105"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold text-ink-950">
                      {w.name}
                    </span>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-ink-500">
                      EVM wallet
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Network + trust points ── */}
          <div className="flex flex-col gap-6">
            {/* Network card */}
            <div className="relative overflow-hidden border-2 border-ink-950 bg-night p-7 text-white">
              <span
                className="liquid-blob"
                style={{ background: "radial-gradient(circle, rgba(230,237,10,0.85), rgba(230,237,10,0.08))", width: 280, height: 280, right: -80, top: -80, opacity: 0.5 }}
                aria-hidden="true"
              />
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold text-white">
                  Arc by Circle
                </h3>
                <span className="border-2 border-ink-950 bg-surface px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-950">
                  Testnet
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                A stablecoin-native L1 built by Circle — sub-second finality,
                gas paid in USDC.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 border-2 border-ink-950 bg-surface px-3 py-1.5 font-mono text-xs font-bold text-ink-950">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-3.5"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path
                      d="M12 5.5a6.5 6.5 0 0 0 0 13c.8 0 1.5-.14 2.2-.4L12 12l2.2-6.1a6.6 6.6 0 0 0-2.2-.4Z"
                      fill="#0a0a0a"
                    />
                  </svg>
                  USDC
                </span>
                <span className="inline-flex items-center gap-1.5 border-2 border-ink-950 bg-surface px-3 py-1.5 font-mono text-xs font-bold text-ink-950">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                  Sub-second finality
                </span>
              </div>
            </div>

            {/* Trust points */}
            <div className="grid gap-3 sm:grid-cols-3">
              {TRUST_POINTS.map((t) => (
                <div
                  key={t.title}
                  className="group glass p-4 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <span
                    className="grid size-9 place-items-center border-2 border-ink-950 text-white transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.icon === "lock" ? (
                      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                        <path d="M12 2a5 5 0 0 0-5 5v2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 7h6v2H9V9Zm3-5a3 3 0 0 1 3 3v2H9V7a3 3 0 0 1 3-3Z" />
                      </svg>
                    ) : t.icon === "card" ? (
                      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <path d="M2 10h20" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <h4 className="mt-3 font-display text-sm font-bold text-ink-950">
                    {t.title}
                  </h4>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-ink-500">
                    {t.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
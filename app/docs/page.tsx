import type { Metadata } from "next";
import Link from "next/link";
import { COUNTRIES } from "@/lib/catalog";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { ServiceIcon } from "@/components/ui/ServiceIcon";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Afritop docs: how to buy airtime, data and prepaid electricity with USDC on Arc, including supported countries, payments, wallets, fees, delivery, security and troubleshooting.",
};

const TOC = [
  { id: "quick-start", label: "Getting started" },
  { id: "countries", label: "Countries & services" },
  { id: "payments", label: "How payments work" },
  { id: "wallets", label: "Wallets" },
  { id: "pricing", label: "Pricing & fees" },
  { id: "delivery", label: "Delivery & receipts" },
  { id: "security", label: "Security" },
  { id: "troubleshooting", label: "Troubleshooting" },
  { id: "support", label: "Support" },
];

const STEPS = [
  {
    n: 1,
    color: "#2f6bff",
    title: "Pick a service",
    text: "Choose airtime, data or prepaid electricity, then your country, network or power utility.",
  },
  {
    n: 2,
    color: "#10b981",
    title: "Enter the details",
    text: "Phone number or meter number, plus the amount. We show the exact USDC total before you pay.",
  },
  {
    n: 3,
    color: "#ffb020",
    title: "Pay with your wallet",
    text: "Your wallet opens automatically. Approve the exact USDC amount on Arc, no account or card needed.",
  },
  {
    n: 4,
    color: "#8b5cf6",
    title: "Delivered",
    text: "Payment is verified on-chain, the top-up lands in seconds, and your receipt is saved.",
  },
];

const WALLETS = [
  { name: "MetaMask", url: "https://metamask.io/download/", note: "The most popular EVM wallet, available as a browser extension and on mobile." },
  { name: "Coinbase Wallet", url: "https://www.coinbase.com/wallet", note: "Self-custody wallet from Coinbase, available on web and mobile." },
  { name: "Trust Wallet", url: "https://trustwallet.com/download", note: "Mobile-first wallet with broad chain support." },
  { name: "Rabby", url: "https://rabby.io", note: "A modern desktop wallet built for multi-chain DeFi." },
];

export default function DocsPage() {
  return (
    <div className="relative flex-1 bg-paper">
      {/* Liquid blobs clipped to the page */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <span
          className="liquid-blob"
          style={{ background: "radial-gradient(circle, rgba(47,107,255,0.8), rgba(47,107,255,0.15))", width: 380, height: 380, left: -130, top: -60, opacity: 0.28 }}
        />
        <span
          className="liquid-blob"
          style={{ background: "radial-gradient(circle, rgba(255,93,143,0.75), rgba(255,93,143,0.14))", width: 340, height: 340, right: -120, top: "25%", opacity: 0.24, animationDelay: "8s" }}
        />
        <span
          className="liquid-blob"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.7), rgba(139,92,246,0.13))", width: 320, height: 320, left: "35%", bottom: -140, opacity: 0.2, animationDelay: "14s" }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {/* ── Hero ── */}
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-600">📖 Documentation</p>
          <h1 className="mt-2 font-display text-h2 font-semibold text-ink-900">
            Afritop documentation
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-500">
            Everything you need to know about topping up Africa with USDC: how it
            works, which countries and services we cover, how payments settle on-chain, and
            how to get help when you need it.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {TOC.map((t) => (
              <a
                key={t.id}
                href={`#${t.id}`}
                className="border-2 border-ink-950 bg-surface px-3.5 py-1.5 text-xs font-bold text-ink-700 transition-all hover:-translate-y-0.5 hover:bg-brand-50"
              >
                {t.label}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-12 lg:grid lg:grid-cols-[230px_1fr] lg:gap-10">
          {/* ── Sticky TOC (desktop) ── */}
          {/* sticky lives on this wrapper — .glass sets position:relative, which
              would override the sticky utility if they shared an element. */}
          <div className="hidden lg:block">
            <div className="lg:sticky lg:top-24">
            <nav className="glass p-5" aria-label="Documentation sections">
              <p className="text-xs font-bold uppercase tracking-widest text-ink-500">On this page</p>
              <ul className="mt-3 space-y-1">
                {TOC.map((t) => (
                  <li key={t.id}>
                    <a
                      href={`#${t.id}`}
                      className="block border-l-2 border-transparent px-2 py-1 text-sm font-medium text-ink-600 transition-colors hover:border-ink-950 hover:text-ink-950"
                    >
                      {t.label}
                    </a>
                  </li>
                ))}
              </ul>
              <a
                href="https://testnet.arcscan.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block border-2 border-ink-950 bg-paper px-3 py-2 text-xs font-bold text-ink-950 transition-all hover:-translate-y-0.5"
              >
                ArcScan explorer ↗
              </a>
            </nav>
            </div>
          </div>

          {/* ── Content ── */}
          <div className="space-y-8">
            {/* Getting started */}
            <Section id="quick-start" title="Getting started" lead="A first top-up takes about 30 seconds. No account, no sign-up, no card.">
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {STEPS.map((s) => (
                  <div key={s.n} className="flex gap-3.5">
                    <span
                      className="grid size-9 shrink-0 place-items-center border-2 border-ink-950 font-display text-sm font-bold text-night"
                      style={{ backgroundColor: s.color }}
                    >
                      {s.n}
                    </span>
                    <div>
                      <h3 className="text-sm font-extrabold text-ink-900">{s.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-ink-500">{s.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link
                  href="/buy"
                  className="btn-cta inline-flex border-2 border-ink-950 bg-night px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-ink-800"
                >
                  Start your first top-up
                </Link>
              </div>
            </Section>

            {/* Countries & services */}
            <Section id="countries" title="Countries & services" lead="Airtime, data and prepaid electricity for four countries. Everything is priced in local currency and paid in USDC.">
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {COUNTRIES.map((c) => (
                  <div key={c.code} className="border-2 border-ink-950 bg-paper p-4">
                    <div className="flex items-center justify-between gap-3">
                      <CountryFlag country={c} className="h-9 w-14 border-2 border-ink-950" />
                      <span className="border-2 border-ink-950 bg-surface px-2.5 py-1 font-mono text-[11px] font-bold text-ink-950">
                        {c.currency}
                      </span>
                    </div>
                    <h3 className="mt-3 text-sm font-extrabold text-ink-900">{c.name}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-500">
                      {c.networks.length} mobile networks · {c.distributors.length} power utilities
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { id: "airtime" as const, label: "Airtime", text: "Instant credit to any phone number on the country's networks." },
                  { id: "data" as const, label: "Data bundles", text: "Pre-priced bundles with clear validity, from 500MB to full gigabyte packs." },
                  { id: "electricity" as const, label: "Electricity tokens", text: "20-digit prepaid tokens generated the moment payment settles." },
                ].map((s) => (
                  <div key={s.id} className="border-2 border-ink-950 bg-surface p-4">
                    <span className="grid size-10 place-items-center border-2 border-ink-950 bg-paper text-ink-950">
                      <ServiceIcon id={s.id} className="size-5" />
                    </span>
                    <h4 className="mt-3 text-sm font-extrabold text-ink-900">{s.label}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-ink-500">{s.text}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Payments */}
            <Section id="payments" title="How payments work" lead="Payments settle in USDC on Arc, Circle's stablecoin Layer-1 built for exactly this.">
              <ul className="mt-6 space-y-4">
                <li className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center border-2 border-ink-950 bg-paper font-mono text-[11px] font-bold text-ink-950">1</span>
                  <p className="text-sm leading-relaxed text-ink-600">
                    <strong className="text-ink-900">Your wallet pays, not us.</strong> When you tap pay, your wallet opens and you
                    approve the exact USDC amount. Your funds only move on your approval. We never hold them.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center border-2 border-ink-950 bg-paper font-mono text-[11px] font-bold text-ink-950">2</span>
                  <p className="text-sm leading-relaxed text-ink-600">
                    <strong className="text-ink-900">On-chain, in seconds.</strong> Transfers settle on Arc with sub-second finality and
                    gas paid in USDC itself. No need to hold the network token.
                  </p>
                </li>
                <li className="flex gap-3">
                  <span className="grid size-6 shrink-0 place-items-center border-2 border-ink-950 bg-paper font-mono text-[11px] font-bold text-ink-950">3</span>
                  <p className="text-sm leading-relaxed text-ink-600">
                    <strong className="text-ink-900">Verified before delivery.</strong> We confirm the payment on-chain, then deliver the
                    top-up. Your receipt links to the transaction on ArcScan.
                  </p>
                </li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-2">
                {[
                  { label: "Arc Testnet", mono: true },
                  { label: "Network: Arc (EVM L1 by Circle)", mono: false },
                  { label: "Gas: paid in USDC", mono: false },
                ].map((c) => (
                  <span key={c.label} className="border-2 border-ink-950 bg-paper px-3 py-1.5 font-mono text-xs font-bold text-ink-950">
                    {c.label}
                  </span>
                ))}
                <a
                  href="https://faucet.circle.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-ink-950 bg-surface px-3 py-1.5 text-xs font-bold text-ink-700 transition-all hover:-translate-y-0.5"
                >
                  Get free testnet USDC ↗
                </a>
              </div>
            </Section>

            {/* Wallets */}
            <Section id="wallets" title="Wallets" lead="Any EVM wallet works. We detect what's installed automatically (EIP-6963), so there's no setup and no accounts.">
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {WALLETS.map((w) => (
                  <a
                    key={w.name}
                    href={w.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group border-2 border-ink-950 bg-surface p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-50"
                  >
                    <h3 className="flex items-center justify-between text-sm font-extrabold text-ink-900">
                      {w.name}
                      <span className="text-ink-400 transition-colors group-hover:text-ink-950">↗</span>
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-500">{w.note}</p>
                  </a>
                ))}
              </div>
              <p className="mt-5 border-l-2 border-ink-950 bg-paper px-4 py-3 text-xs leading-relaxed text-ink-500">
                <strong className="text-ink-900">First time on Arc?</strong> Your wallet will be asked to add the Arc Testnet network.
                Approve it once and you&apos;re set. If nothing opens when you tap pay, install any of the wallets above and reload.
              </p>
            </Section>

            {/* Pricing */}
            <Section id="pricing" title="Pricing & fees" lead="Face value plus a flat platform fee, shown before you pay. No hidden margins.">
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Face value", text: "You pay the exact price of the top-up in local currency, converted to USDC." },
                  { label: "Platform fee", text: "A flat 1.5% of the USD amount (minimum $0.05), shown up front." },
                  { label: "No surprises", text: "The USDC total you approve in your wallet is exactly what we charge." },
                ].map((f) => (
                  <div key={f.label} className="border-2 border-ink-950 bg-surface p-4">
                    <h3 className="font-display text-sm font-bold text-ink-900">{f.label}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-ink-500">{f.text}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs leading-relaxed text-ink-500">
                Exchange rates come from a live source and update every minute, so the rate you see at checkout is the rate you get.
              </p>
            </Section>

            {/* Delivery & receipts */}
            <Section id="delivery" title="Delivery & receipts" lead="Airtime lands in seconds; electricity tokens are generated the moment payment settles.">
              <ul className="mt-6 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-600">
                <li><strong className="text-ink-900">Airtime & data</strong> are credited to the line within seconds of on-chain confirmation.</li>
                <li><strong className="text-ink-900">Electricity</strong> shows a 20-digit recharge token on your receipt. Enter it on your meter.</li>
                <li><strong className="text-ink-900">Receipts</strong> are saved for every order, with the token, amount and on-chain transaction link.</li>
                <li><strong className="text-ink-900">History on any device</strong>: sign in with your wallet and your history syncs to the cloud and follows you.</li>
                <li><strong className="text-ink-900">No account needed</strong>. Receipts stay saved on your device even before you sign in.</li>
              </ul>
            </Section>

            {/* Security */}
            <Section id="security" title="Security" lead="Self-custody by design. Your money stays in your wallet until you approve.">
              <ul className="mt-6 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-600">
                <li><strong className="text-ink-900">Self-custody</strong>. We never see or store your private keys, and USDC leaves your wallet only when you approve.</li>
                <li><strong className="text-ink-900">No card, no KYC</strong>. Nothing to leak, and your payment details are your wallet signature.</li>
                <li><strong className="text-ink-900">On-chain proof</strong>. Every payment is verifiable on ArcScan, and every receipt links to its transaction.</li>
                <li><strong className="text-ink-900">Encrypted connections</strong>. All traffic is HTTPS end to end.</li>
                <li><strong className="text-ink-900">Minimum data</strong>. We only keep what&apos;s needed to deliver your order (phone/meter numbers, receipts).</li>
              </ul>
            </Section>

            {/* Troubleshooting */}
            <Section id="troubleshooting" title="Troubleshooting" lead="Quick fixes for the things that occasionally trip people up.">
              <div className="mt-6 space-y-4">
                {[
                  { q: "Nothing happens when I tap pay", a: "No wallet is installed or detected. Install MetaMask, Coinbase, Trust or Rabby, reload and try again. We detect it automatically." },
                  { q: "My wallet says 'add network'", a: "Approve adding Arc Testnet once. That's the network we settle on, and it's a one-time step." },
                  { q: "Payment sent but still confirming", a: "If your transfer shows on the explorer, tap Check again and we'll finish the top-up. If it failed on-chain, nothing was charged. Just start a new payment." },
                  { q: "Top-up hasn't arrived", a: "Usually a seconds-level delay from the network operator. Check your receipt status; if it shows Delivered, the vendor has sent it." },
                  { q: "Wrong number entered", a: "Always double-check the number before approving payment. Top-ups go to the number you entered and are final once sent." },
                ].map((f) => (
                  <div key={f.q} className="border-2 border-ink-950 bg-paper p-4">
                    <h3 className="text-sm font-extrabold text-ink-900">{f.q}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-500">{f.a}</p>
                  </div>
                ))}
              </div>
            </Section>

            {/* Support */}
            <Section id="support" title="Support" lead="Reach a real person quickly. Pick a channel below.">
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="https://wa.me/2348168969816"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border-2 border-ink-950 bg-[#25D366] px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5"
                >
                  WhatsApp support
                </a>
                <a
                  href="mailto:ibramzzzy@gmail.com"
                  className="inline-flex items-center gap-2 border-2 border-ink-950 bg-surface px-5 py-3 text-sm font-bold text-ink-950 transition-all hover:-translate-y-0.5 hover:bg-brand-50"
                >
                  Email the team
                </a>
                <a
                  href="https://x.com/AfriTopapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border-2 border-ink-950 bg-night px-5 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-ink-800"
                >
                  @AfriTopapp on X
                </a>
              </div>
              <p className="mt-5 text-xs leading-relaxed text-ink-500">
                Need the deeper technical details? Read the{" "}
                <a href="https://docs.arc.io" target="_blank" rel="noopener noreferrer" className="font-bold text-ink-900 underline underline-offset-2 hover:text-brand-600">
                  Arc documentation
                </a>{" "}
                and{" "}
                <a href="https://developers.circle.com" target="_blank" rel="noopener noreferrer" className="font-bold text-ink-900 underline underline-offset-2 hover:text-brand-600">
                  Circle developer docs
                </a>
                .
              </p>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  lead,
  children,
}: {
  id: string;
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="glass-strong scroll-mt-24 p-6 sm:p-8">
      <h2 className="font-display text-2xl font-bold text-ink-900">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-500">{lead}</p>
      {children}
    </section>
  );
}

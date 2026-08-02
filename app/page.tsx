import Link from "next/link";
import { COUNTRIES, SERVICES } from "@/lib/catalog";
import { formatLocal } from "@/lib/fx";

const STEPS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
      </svg>
    ),
    title: "Choose your top-up",
    text: "Pick airtime, data or electricity — then your country, network and amount.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    title: "Pay from your wallet",
    text: "Connect any EVM wallet and pay USDC on Arc Testnet — confirmed on-chain.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2Z" />
      </svg>
    ),
    title: "Delivered instantly",
    text: "The moment your USDC settles on-chain, we credit the phone or meter.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
    title: "Get your receipt",
    text: "Every order is tracked in your history with a full USD breakdown.",
  },
];

const FEATURES = [
  {
    title: "Instant delivery",
    text: "Airtime credits hit the number in seconds. Electricity tokens are generated the moment payment settles.",
  },
  {
    title: "Transparent pricing",
    text: "You pay face value plus a flat 1.5% platform fee — displayed before you pay. No hidden margins.",
  },
  {
    title: "USDC-first payments",
    text: "Settle in stable, borderless USDC straight from your own wallet on Arc — Circle's stablecoin network.",
  },
  {
    title: "Built for Africa",
    text: "Local currencies, local networks and local power companies — from Nigeria to South Africa.",
  },
];

export default function Home() {
  const ng = COUNTRIES.find((c) => c.code === "NG")!;

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="bg-grid-dark absolute inset-0" aria-hidden="true" />
        <div className="bg-radial-sun absolute inset-0" aria-hidden="true" />

        <div className="relative mx-auto grid max-w-6xl gap-16 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-28 lg:pt-24">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-sun-300 backdrop-blur">
              <span className="relative flex size-2">
                <span className="animate-ping-slow absolute inline-flex size-2 rounded-full bg-sun-400" />
                <span className="relative inline-flex size-2 rounded-full bg-sun-400" />
              </span>
              Now live in Nigeria · Ghana · Kenya · South Africa
            </span>

            <h1 className="mt-7 font-display text-[2.75rem] font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.25rem]">
              Power up Africa,{" "}
              <span className="italic text-sun-300">from anywhere.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-300">
              Buy airtime, data bundles and prepaid electricity for Nigeria, Ghana,
              Kenya and South Africa — pay in USDC from any EVM wallet, delivered
              in seconds.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/buy"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sun-400 px-7 py-3.5 text-base font-bold text-ink-950 shadow-xl shadow-sun-500/25 transition-all hover:-translate-y-0.5 hover:bg-sun-300 hover:shadow-2xl"
              >
                Top up now
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-base font-bold text-white backdrop-blur transition-colors hover:bg-white/10"
              >
                See how it works
              </a>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6">
              {[
                { v: "14", l: "Mobile networks" },
                { v: "11", l: "Power utilities" },
                { v: "<60s", l: "Avg. delivery" },
              ].map((s) => (
                <div key={s.l} className="border-l border-sun-400/50 pl-4">
                  <dt className="font-display text-3xl font-bold text-white">{s.v}</dt>
                  <dd className="mt-1 text-xs font-medium text-ink-400 sm:text-sm">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Floating card stack */}
          <div className="relative hidden lg:block" aria-hidden="true">
            <div className="animate-float relative mx-auto max-w-sm">
              <div className="absolute -left-10 top-8 w-64 -rotate-6 rounded-2xl border border-white/10 bg-ink-900/90 p-4 shadow-2xl backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">Electricity · ECG</p>
                <p className="mt-1 font-mono text-sm tracking-widest text-sun-300">4623-9182-…</p>
                <p className="mt-2 text-[10px] text-ink-400">GH₵ 100 prepaid token</p>
              </div>
              <div className="absolute -right-8 top-24 w-60 rotate-6 rounded-2xl border border-white/10 bg-ink-900/90 p-4 shadow-2xl backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">Data · Safaricom</p>
                <p className="mt-1 text-sm font-bold text-white">5 GB · KSh 750</p>
                <p className="mt-2 text-[10px] text-ink-400">30 days validity</p>
              </div>

              <div className="relative rounded-3xl border border-white/10 bg-ink-900/90 p-6 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-400">Airtime · MTN</p>
                  <span className="grid size-9 place-items-center rounded-xl bg-white/10 text-lg">📱</span>
                </div>
                <p className="mt-5 font-mono text-3xl font-bold tracking-tight text-white">
                  ₦500<span className="ml-2 text-base font-medium text-ink-400">top-up</span>
                </p>
                <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                  <span className="text-sm text-ink-300">→ +234 801 234 5678</span>
                  <span className="flex items-center gap-1.5 rounded-full bg-brand-400/15 px-2.5 py-1 text-[11px] font-bold text-brand-200">
                    ✓ Delivered
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-ink-400">
                  <span>Paid in USDC</span>
                  <span className="font-mono font-bold text-sun-300">$0.37</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────── */}
      <section className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-6 text-center text-xs font-semibold uppercase tracking-widest text-ink-400 sm:px-6">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-brand-500" /> Powered by Africa&apos;s Talking
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-sun-500" /> USDC payments on Arc by Circle
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-brand-500" /> 4 countries &amp; growing
          </span>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────── */}
      <section id="services" className="bg-paper py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">What you can buy</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
              Everything your phone &amp; home need
            </h2>
            <p className="mt-4 text-lg text-ink-500">
              Three services, one checkout. Pick what you need — we handle the rest.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {SERVICES.map((s, i) => (
              <Link
                key={s.id}
                href="/buy"
                className="group relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10"
              >
                <span className="absolute right-6 top-5 font-display text-3xl italic text-ink-100 transition-colors group-hover:text-brand-200">
                  0{i + 1}
                </span>
                <div className="flex items-start justify-between">
                  <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-3xl transition-transform duration-300 group-hover:scale-110">
                    {s.icon}
                  </span>
                </div>
                <h3 className="mt-6 font-display text-2xl font-bold text-ink-900">{s.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.tagline}</p>
                <div className="mt-6 flex items-center justify-between border-t border-ink-100 pt-4 text-sm">
                  <span className="font-bold text-brand-700">
                    {s.id === "airtime" && `from ${formatLocal(ng.minAirtime, "NGN")}`}
                    {s.id === "data" && "from ₦300 / 500MB"}
                    {s.id === "electricity" && `from ${formatLocal(ng.minElectricity, "NGN")}`}
                  </span>
                  <span className="flex items-center gap-1 text-ink-400 transition-colors group-hover:text-brand-600">
                    Buy
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section id="how-it-works" className="relative overflow-hidden bg-white py-20 sm:py-24">
        <div className="bg-grid-light absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">How it works</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
              From tap to token in four steps
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="relative rounded-3xl border border-ink-100 bg-white/80 p-6 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-ink-900/5"
              >
                <span className="absolute right-5 top-4 font-display text-5xl italic leading-none text-ink-100">
                  {i + 1}
                </span>
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-700 text-white shadow-lg shadow-brand-900/20">
                  {step.icon}
                </span>
                <h3 className="mt-5 font-display text-xl font-bold text-ink-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Countries ────────────────────────────────────────── */}
      <section id="countries" className="bg-paper py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Coverage</p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
                Four countries, one wallet
              </h2>
            </div>
            <p className="max-w-xs text-sm text-ink-500">
              Local networks and power utilities, priced in local currency — paid in USDC.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {COUNTRIES.map((c) => (
              <Link
                key={c.code}
                href="/buy"
                className="group rounded-3xl border border-ink-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-4xl transition-transform duration-300 group-hover:scale-110">{c.flag}</span>
                  <span className="rounded-full bg-ink-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-600">
                    {c.currency}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-ink-900">{c.name}</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.networks.map((n) => (
                    <span
                      key={n.id}
                      className="rounded-full border border-ink-100 bg-ink-50 px-2.5 py-1 text-[11px] font-semibold text-ink-600"
                    >
                      {n.short}
                    </span>
                  ))}
                </div>
                <p className="mt-4 border-t border-ink-100 pt-3 text-xs text-ink-400">
                  {c.distributors.length} power utilities · {c.networks.length} networks
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why / pricing ────────────────────────────────────── */}
      <section id="pricing" className="relative overflow-hidden bg-ink-950 py-20 text-white sm:py-24">
        <div className="bg-grid-dark absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-widest text-sun-400">Why Afritop</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Honest pricing, zero surprises
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-colors hover:border-brand-400/40 hover:bg-white/[0.08]"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-brand-500/20 text-brand-300">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
                  </svg>
                </span>
                <h3 className="mt-4 font-display text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-300">{f.text}</p>
              </div>
            ))}
          </div>

          {/* FX transparency */}
          <div className="mt-10 flex flex-col items-center justify-between gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur sm:flex-row">
            <div>
              <h3 className="font-display text-xl font-bold">Indicative exchange rates</h3>
              <p className="mt-1 text-sm text-ink-400">
                Your local amount is converted to USD for the USDC checkout. Rates shown at checkout.
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {[
                { c: "NGN", r: "₦1,480" },
                { c: "GHS", r: "GH₵15.2" },
                { c: "KES", r: "KSh128" },
                { c: "ZAR", r: "R17.6" },
              ].map((f) => (
                <span key={f.c} className="rounded-xl border border-white/15 bg-ink-900/60 px-4 py-2 font-mono text-sm text-sun-300">
                  {f.c} <span className="text-ink-400">→ $</span>1 · {f.r}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-paper px-4 py-20 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-brand-900 px-6 py-16 text-center text-white shadow-2xl shadow-brand-900/30 sm:px-12">
          <div className="bg-grid-dark absolute inset-0" aria-hidden="true" />
          <div className="relative">
            <span className="grid size-16 place-items-center rounded-full bg-sun-400/15 text-4xl">⚡</span>
            <h2 className="mx-auto mt-6 max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Your phone is low. Your meter is running.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-brand-100">
              Solve it in seconds — pay in USDC from your own wallet and the top-up lands instantly.
            </p>
            <Link
              href="/buy"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-sun-400 px-8 py-4 text-base font-extrabold text-ink-950 shadow-xl transition-all hover:-translate-y-0.5 hover:bg-sun-300 hover:shadow-2xl"
            >
              Start your first top-up
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

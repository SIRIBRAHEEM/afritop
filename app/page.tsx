import Link from "next/link";
import { COUNTRIES, SERVICES } from "@/lib/catalog";
import { formatLocal } from "@/lib/fx";
import { Faq } from "@/components/Faq";
import { LiveFxRates } from "@/components/LiveFxRates";
import { PaymentNetworks } from "@/components/PaymentNetworks";
import { NumberTicker } from "@/components/ui/NumberTicker";
import { Marquee } from "@/components/ui/Marquee";
import { ServiceIcon } from "@/components/ui/ServiceIcon";
import { CountryFlag } from "@/components/ui/CountryFlag";

const STATS = [
  { v: 99, suffix: "%", l: "delivery success rate" },
  { v: 14, suffix: "", l: "mobile networks" },
  { v: 11, suffix: "", l: "power utilities" },
  { v: 60, prefix: "<", suffix: "s", l: "average delivery" },
];

const STEPS = [
  {
    title: "Choose your top-up",
    text: "Pick airtime, data or electricity — then your country, network and amount.",
  },
  {
    title: "Pay with USDC",
    text: "Connect any EVM wallet and pay in stable USDC on Arc — confirmed on-chain.",
  },
  {
    title: "Delivered in seconds",
    text: "The moment payment settles, we credit the phone or meter. Receipt in your history.",
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
      <section className="relative border-b-2 border-ink-950 bg-paper">
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-14 sm:px-6 lg:pb-16 lg:pt-20">
          <div className="grid items-end gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
            {/* Big monospace headline — left */}
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 border-2 border-ink-950 bg-brand-50 px-3.5 py-1.5 text-xs font-medium text-brand-700">
                <span className="relative flex size-2">
                  <span className="animate-ping-slow absolute inline-flex size-2 bg-ink-950" />
                  <span className="relative inline-flex size-2 bg-ink-950" />
                </span>
                Now live in Nigeria · Ghana · Kenya · South Africa
              </span>

              <h1 className="mt-7 font-display text-hero font-bold text-ink-950">
                The fastest way to top up Africa,{" "}
                <span className="text-ink-700">in seconds.</span>
              </h1>
            </div>

            {/* Supporting paragraph + black CTA — right */}
            <div className="animate-fade-up lg:pb-2" style={{ animationDelay: "120ms" }}>
              <p className="text-lg leading-relaxed text-ink-500">
                Buy airtime, data bundles and prepaid electricity for Nigeria, Ghana,
                Kenya and South Africa — pay in USDC from your own wallet, delivered
                in seconds.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/buy"
                  className="btn-cta inline-flex items-center justify-center gap-2 border-2 border-ink-950 bg-night px-7 py-3.5 text-base font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-ink-800"
                >
                  Top up now
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 border-2 border-ink-950 bg-surface px-7 py-3.5 text-base font-medium text-ink-950 transition-all hover:-translate-y-0.5 hover:bg-brand-50"
                >
                  See how it works
                </a>
              </div>

              <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-4">
                {STATS.map((s) => (
                  <div key={s.l}>
                    <dt className="font-display text-3xl font-bold text-ink-950 sm:text-4xl">
                      <NumberTicker
                        value={s.v}
                        prefix={s.prefix ?? ""}
                        suffix={s.suffix}
                      />
                    </dt>
                    <dd className="mt-1 text-xs font-medium leading-snug text-ink-500 sm:text-sm">{s.l}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* ── Product preview panel ────────────────────────── */}
          <div className="mt-14 animate-fade-up lg:mt-20" style={{ animationDelay: "200ms" }}>
            <div className="overflow-hidden border-2 border-ink-950 bg-surface">
              {/* Browser chrome bar */}
              <div className="flex items-center gap-3 border-b-2 border-ink-950 bg-paper px-4 py-3">
                <span className="flex flex-col gap-1" aria-hidden="true">
                  <span className="block h-0.5 w-4 bg-ink-950" />
                  <span className="block h-0.5 w-4 bg-ink-950" />
                  <span className="block h-0.5 w-4 bg-ink-950" />
                </span>
                {/* lime pill input bar */}
                <div className="flex h-8 flex-1 items-center gap-2 border-2 border-ink-950 bg-paper px-3">
                  <span className="grid size-4 place-items-center border-2 border-ink-950 bg-surface" aria-hidden="true">
                    <svg viewBox="0 0 24 24" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="m21 21-4.3-4.3M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" /></svg>
                  </span>
                  <span className="hidden font-mono text-xs font-bold text-ink-950 sm:block">afritop.app / buy</span>
                </div>
                <span className="grid size-8 place-items-center border-2 border-ink-950 bg-surface text-ink-950" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" /></svg>
                </span>
                <span className="grid size-8 place-items-center border-2 border-ink-950 bg-surface text-ink-950" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </span>
                <span className="grid size-8 place-items-center border-2 border-ink-950 bg-night text-white" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v4m0 14v4M4.2 4.2l2.8 2.8m10 10 2.8 2.8M1 12h4m14 0h4M4.2 19.8l2.8-2.8m10-10 2.8-2.8" /></svg>
                </span>
              </div>

              <div className="grid md:grid-cols-[210px_1fr]">
                {/* Sidebar — black bar placeholders */}
                <aside className="hidden border-r-2 border-ink-950 bg-paper p-4 md:block" aria-hidden="true">
                  <div className="space-y-3">
                    <span className="block h-2.5 w-3/4 bg-ink-950" />
                    <span className="block h-2.5 w-full bg-ink-950" />
                    <span className="block h-2.5 w-1/2 bg-ink-950" />
                    <span className="block h-2.5 w-2/3 bg-ink-950" />
                    <span className="block h-2.5 w-5/6 bg-ink-950" />
                  </div>
                  <div className="mt-6 border-t-2 border-ink-950 pt-4">
                    <span className="block h-2 w-2/3 bg-ink-950" />
                    <span className="mt-3 block h-2 w-1/2 bg-ink-950" />
                  </div>
                </aside>

                {/* Main panel */}
                <div className="p-5 sm:p-6">
                  {/* Tab bar — active white pill, rest text on dark bar */}
                  <div className="flex items-center gap-2 border-2 border-ink-950 bg-night px-3 py-2">
                    <span className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-ink-950">Airtime</span>
                    <span className="px-3 py-1.5 text-xs font-medium text-white/60">Data</span>
                    <span className="px-3 py-1.5 text-xs font-medium text-white/60">Electricity</span>
                  </div>

                  <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
                    {/* Flat line/area chart — black strokes on lime fill */}
                    <div className="border-2 border-ink-950 bg-paper p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-ink-500">Deliveries this week</p>
                        <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-ink-950">
                          <span className="size-2 bg-ink-950" />
                          live
                        </span>
                      </div>
                      <svg viewBox="0 0 320 120" className="mt-3 w-full text-ink-950" aria-hidden="true">
                        {/* area fill */}
                        <path
                          d="M0 92 L45 80 L90 86 L135 62 L180 70 L225 42 L270 54 L320 30 L320 120 L0 120 Z"
                          fill="#d4ff3f"
                          stroke="none"
                        />
                        {/* ink stroke line */}
                        <path
                          d="M0 92 L45 80 L90 86 L135 62 L180 70 L225 42 L270 54 L320 30"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinejoin="round"
                          strokeLinecap="round"
                        />
                        {/* baseline + ticks */}
                        <line x1="0" y1="116" x2="320" y2="116" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="0" y1="8" x2="320" y2="8" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
                      </svg>
                      <div className="mt-2 flex items-center justify-between font-mono text-[11px] font-bold text-ink-500">
                        <span>mon</span>
                        <span>wed</span>
                        <span>fri</span>
                        <span>sun</span>
                      </div>
                    </div>

                    {/* Live receipt card */}
                    <div className="border-2 border-ink-950 bg-surface p-5">
                      <div className="flex items-center justify-between">
                        <span className="grid size-9 place-items-center border-2 border-ink-950 bg-brand-50 text-ink-950">
                          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 2 11 13" /><path d="M22 2 15 22l-5-8-5-8L2 15" />
                          </svg>
                        </span>
                        <span className="border-2 border-ink-950 bg-paper px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-950">Airtime</span>
                      </div>
                      <p className="mt-4 text-sm font-medium text-ink-700">MTN Nigeria</p>
                      <p className="mt-0.5 font-display text-3xl font-bold text-ink-950">
                        ₦500<span className="ml-2 text-sm font-medium text-ink-500">top-up</span>
                      </p>
                      <p className="mt-0.5 text-xs text-ink-500">to +234 801 234 5678</p>

                      <div className="btn-cta mt-4 flex items-center justify-center gap-2 border-2 border-ink-950 bg-night py-3 text-sm font-medium text-white">
                        Pay with USDC
                        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-2 border-ink-950 bg-brand-50 px-3.5 py-2.5">
                        <span className="text-xs font-bold text-ink-950">Delivered</span>
                        <span className="flex items-center gap-1.5 text-xs font-extrabold text-ink-950">
                          <span className="grid size-4 place-items-center bg-night text-white">
                            <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          </span>
                          9 seconds
                        </span>
                      </div>
                      <p className="mt-3 text-center font-mono text-xs font-bold text-ink-500">
                        Paid in USDC · <span className="text-ink-950">$0.37</span>
                      </p>
                    </div>
                  </div>

                  {/* Secondary receipt cards — ECG + Safaricom */}
                  <div className="mt-5 grid grid-cols-2 gap-4">
                    <div className="border-2 border-ink-950 bg-surface p-4">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-ink-500">Electricity · ECG</p>
                      <p className="mt-1 font-mono text-sm font-bold tracking-widest text-ink-950">4623-9182-…</p>
                      <p className="mt-1 text-[11px] font-medium text-ink-500">GH₵ 100 prepaid token</p>
                    </div>
                    <div className="border-2 border-ink-950 bg-surface p-4">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-ink-500">Data · Safaricom</p>
                      <p className="mt-1 text-sm font-bold text-ink-950">5 GB · KSh 750</p>
                      <p className="mt-1 text-[11px] font-medium text-ink-500">30 days validity</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust marquee ───────────────────────────────────── */}
      <section className="border-b-2 border-ink-950 bg-paper py-6">
        <Marquee speed={32} className="mx-auto max-w-6xl">
          <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-ink-500">
            <span className="size-2 bg-ink-950" /> Powered by Africa&apos;s Talking
          </span>
          <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-ink-500">
            <span className="size-2 bg-ink-950" /> USDC payments on Arc by Circle
          </span>
          <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-ink-500">
            <span className="size-2 bg-ink-950" /> 4 countries &amp; growing
          </span>
          <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-ink-500">
            <span className="size-2 bg-ink-950" /> On-chain verified
          </span>
          <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-ink-500">
            <span className="size-2 bg-ink-950" /> 14 mobile networks
          </span>
        </Marquee>
      </section>

      {/* ── Services ─────────────────────────────────────────── */}
      <section id="services" className="border-b-2 border-ink-950 bg-paper py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-widest text-ink-500">What you can buy</p>
              <h2 className="mt-3 font-display text-h2 font-bold text-ink-950">
                Everything your phone &amp; home need
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-ink-500">
              Three services, one checkout. Pick what you need — we handle the rest.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {SERVICES.map((s, i) => (
              <Link
                key={s.id}
                href="/buy"
                className="group relative block h-full border-2 border-ink-950 bg-surface p-7 transition-all duration-200 hover:-translate-y-1 hover:bg-brand-50"
              >
                <span className="absolute right-6 top-5 font-display text-3xl text-brand-500 transition-colors group-hover:text-brand-400">
                  0{i + 1}
                </span>
                <span className="grid size-14 place-items-center border-2 border-ink-950 bg-paper text-ink-950 transition-all duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:shadow-[0_0_0_3px_rgba(212,255,63,0.45)]">
                  <span className="animate-icon-bob">
                    <ServiceIcon id={s.id} className="size-7" />
                  </span>
                </span>
                <h3 className="mt-6 font-display text-2xl font-bold text-ink-950">{s.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.tagline}</p>
                <div className="mt-6 flex items-center justify-between pt-4 text-sm">
                  <span className="font-medium text-ink-950">
                    {s.id === "airtime" && `from ${formatLocal(ng.minAirtime, "NGN")}`}
                    {s.id === "data" && "from ₦300 / 500MB"}
                    {s.id === "electricity" && `from ${formatLocal(ng.minElectricity, "NGN")}`}
                  </span>
                  <span className="flex items-center gap-1 font-medium text-ink-500 transition-colors group-hover:text-ink-950">
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
      <section id="how-it-works" className="scroll-mt-20 border-b-2 border-ink-950 bg-paper py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-ink-500">How it works</p>
            <h2 className="mt-3 font-display text-4xl font-bold text-ink-950 sm:text-5xl">
              Top-up in three quick steps
            </h2>
            <p className="mt-4 text-lg text-ink-500">
              The fastest way to top-up — from choosing to delivered, in under a minute.
            </p>
          </div>

          <div className="relative mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            <div
              className="absolute left-[16.6%] right-[16.6%] top-7 hidden h-px bg-ink-950 sm:block"
              aria-hidden="true"
            />
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative text-center">
                <span className="relative z-10 mx-auto grid size-14 place-items-center border-2 border-ink-950 bg-surface font-display text-xl font-bold text-ink-950">
                  {i + 1}
                </span>
                <h3 className="mt-6 font-display text-xl font-bold text-ink-950">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Countries ────────────────────────────────────────── */}
      <section id="countries" className="scroll-mt-20 border-b-2 border-ink-950 bg-paper py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm font-medium uppercase tracking-widest text-ink-500">Coverage</p>
              <h2 className="mt-3 font-display text-h2 font-bold text-ink-950">
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
                className="group border-2 border-ink-950 bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:bg-brand-50"
              >
                <div className="flex items-center justify-between">
                  <span className="block origin-left transition-transform duration-300 group-hover:-rotate-2 group-hover:scale-110">
                    <span className="block origin-center group-hover:animate-[flag-wave_0.8s_ease-in-out]">
                      <CountryFlag country={c} className="h-12 w-16 border-2 border-ink-950" />
                    </span>
                  </span>
                  <span className="border-2 border-ink-950 bg-paper px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-950">
                    {c.currency}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-ink-950">{c.name}</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.networks.map((n) => (
                    <span key={n.id} className="border-2 border-ink-950 bg-paper px-2.5 py-1 text-[11px] font-bold text-ink-950">
                      {n.short}
                    </span>
                  ))}
                </div>
                <p className="mt-4 pt-3 text-xs text-ink-500">
                  {c.distributors.length} power utilities · {c.networks.length} networks
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Supported payment networks ─────────────────────── */}
      <PaymentNetworks />

      {/* ── Why Afritop ──────────────────────────────────────── */}
      <section id="pricing" className="scroll-mt-20 border-b-2 border-ink-950 bg-paper py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-widest text-ink-500">Why Afritop</p>
            <h2 className="mt-3 font-display text-4xl font-bold text-ink-950 sm:text-5xl">
              Honest pricing, zero surprises
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="border-2 border-ink-950 bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:bg-brand-50"
              >
                <span className="btn-cta grid size-11 place-items-center border-2 border-ink-950 bg-night text-white">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-ink-950">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.text}</p>
              </div>
            ))}
          </div>

          {/* FX transparency — live rates */}
          <div className="mt-10 flex flex-col items-center justify-between gap-6 border-2 border-ink-950 bg-surface p-8 sm:flex-row">
            <div>
              <h3 className="font-display text-xl font-bold text-ink-950">Live exchange rates</h3>
              <p className="mt-1 text-sm text-ink-500">
                Real-time rates from Frankfurter API. Updated every 60 seconds. Rates shown at checkout.
              </p>
            </div>
            <LiveFxRates />
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section id="faq" className="scroll-mt-20 border-b-2 border-ink-950 bg-paper py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-ink-500">FAQ</p>
            <h2 className="mt-3 font-display text-4xl font-bold text-ink-950 sm:text-5xl">
              Questions, answered
            </h2>
            <p className="mt-4 text-lg text-ink-500">
              Everything you need to know about topping up with Afritop.
            </p>
          </div>
          <div className="mt-12">
            <Faq />
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="bg-paper px-4 pb-20 sm:px-6">
        <div className="relative mx-auto max-w-6xl overflow-hidden border-2 border-ink-950 bg-night px-6 py-16 text-center text-white sm:px-12">
          <div className="relative">
            <span className="mx-auto grid size-16 place-items-center border-2 border-ink-950 bg-surface text-ink-950">
              <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </span>
            <h2 className="mx-auto mt-6 max-w-2xl font-display text-h2 font-bold">
              Your phone is low.{" "}
              <span className="text-white">Your meter is running.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">
              Solve it in seconds — pay in USDC from your own wallet and the top-up lands instantly.
            </p>
            <Link
              href="/buy"
              className="mt-8 inline-flex items-center gap-2 border-2 border-ink-950 bg-surface px-8 py-4 text-base font-bold text-ink-950 transition-all hover:-translate-y-0.5 hover:bg-brand-50"
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
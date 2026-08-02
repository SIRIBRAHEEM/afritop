import Link from "next/link";
import { COUNTRIES, SERVICES } from "@/lib/catalog";
import { formatLocal } from "@/lib/fx";
import { Faq } from "@/components/Faq";

const STATS = [
  { v: "99%", l: "delivery success rate" },
  { v: "14", l: "mobile networks" },
  { v: "11", l: "power utilities" },
  { v: "<60s", l: "average delivery" },
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
      <section className="relative overflow-hidden bg-surface">
        <div className="bg-grid-light absolute inset-0" aria-hidden="true" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(40rem 26rem at 82% -8%, rgba(226,165,50,0.14), transparent 60%), radial-gradient(36rem 26rem at 6% 108%, rgba(68,111,72,0.09), transparent 60%)",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-24 lg:pt-20">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3.5 py-1.5 text-xs font-bold text-brand-700">
              <span className="relative flex size-2">
                <span className="animate-ping-slow absolute inline-flex size-2 rounded-full bg-brand-500" />
                <span className="relative inline-flex size-2 rounded-full bg-brand-500" />
              </span>
              Now live in Nigeria · Ghana · Kenya · South Africa
            </span>

            <h1 className="mt-6 font-display text-[2.9rem] font-bold leading-[1.04] tracking-tight text-ink-950 sm:text-6xl lg:text-[4.1rem]">
              The fastest way to top up Africa,{" "}
              <span className="italic text-sun-600">in seconds.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-500">
              Buy airtime, data bundles and prepaid electricity for Nigeria, Ghana,
              Kenya and South Africa — pay in USDC from your own wallet, delivered
              in seconds.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/buy"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink-950 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-ink-950/20 transition-all hover:-translate-y-0.5 hover:bg-ink-800 hover:shadow-2xl dark:bg-sun-400 dark:text-ink-950 dark:hover:bg-sun-300"
              >
                Top up now
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sun-400 px-7 py-3.5 text-base font-bold text-ink-950 shadow-lg shadow-sun-500/25 transition-all hover:-translate-y-0.5 hover:bg-sun-300"
              >
                See how it works
              </a>
            </div>

            <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.l}>
                  <dt className="font-display text-3xl font-bold tracking-tight text-ink-950 sm:text-4xl">{s.v}</dt>
                  <dd className="mt-1 text-xs font-semibold leading-snug text-ink-400 sm:text-sm">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Product visual — phone mockup */}
          <div className="relative mx-auto w-full max-w-sm animate-fade-up lg:max-w-md" style={{ animationDelay: "120ms" }}>
            <div className="animate-float">
              {/* floating token card */}
              <div
                className="absolute -left-4 -top-7 z-10 w-44 -rotate-6 rounded-2xl bg-surface p-4 shadow-[0_24px_50px_-20px_rgba(39,35,28,0.35)] sm:-left-8"
                style={{ animationDelay: "0.8s" }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">Electricity · ECG</p>
                <p className="mt-1 font-mono text-sm font-bold tracking-widest text-brand-700">4623-9182-…</p>
                <p className="mt-1.5 text-[10px] text-ink-400">GH₵ 100 prepaid token</p>
              </div>
              {/* floating data card */}
              <div
                className="absolute -right-3 top-12 z-10 w-44 rotate-6 rounded-2xl bg-surface p-4 shadow-[0_24px_50px_-20px_rgba(39,35,28,0.35)] sm:-right-6"
                style={{ animationDelay: "1.6s" }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">Data · Safaricom</p>
                <p className="mt-1 text-sm font-bold text-ink-950">5 GB · KSh 750</p>
                <p className="mt-1.5 text-[10px] text-ink-400">30 days validity</p>
              </div>

              {/* main phone card */}
              <div className="relative rounded-[2rem] bg-surface p-6 shadow-[0_50px_100px_-45px_rgba(39,35,28,0.45)] sm:p-7">
                <div className="flex items-center justify-between">
                  <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-xl">📱</span>
                  <span className="rounded-full bg-ink-100 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-600">
                    Airtime
                  </span>
                </div>

                <p className="mt-6 text-sm font-bold text-ink-700">MTN Nigeria</p>
                <p className="mt-1 font-mono text-4xl font-bold tracking-tight text-ink-950">
                  ₦500<span className="ml-2 text-base font-medium text-ink-400">top-up</span>
                </p>
                <p className="mt-1 text-xs text-ink-400">to +234 801 234 5678</p>

                <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-sun-400 py-4 text-sm font-extrabold text-ink-950 shadow-lg shadow-sun-500/30">
                  Pay with USDC
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl bg-brand-50 px-4 py-3.5">
                  <span className="text-xs font-bold text-brand-700">Delivered</span>
                  <span className="flex items-center gap-1.5 text-xs font-extrabold text-brand-700">
                    <span className="grid size-4 place-items-center rounded-full bg-brand-600 text-[9px] text-white">✓</span>
                    9 seconds
                  </span>
                </div>

                <p className="mt-4 text-center font-mono text-[11px] font-bold text-ink-400">
                  Paid in USDC · <span className="text-sun-600">$0.37</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────── */}
      <section className="bg-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 py-5 text-center text-xs font-bold uppercase tracking-widest text-ink-500 sm:px-6">
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
      <section id="services" className="bg-surface py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-widest text-brand-600">What you can buy</p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink-950 sm:text-5xl">
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
                className="group relative overflow-hidden rounded-3xl bg-paper p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:bg-surface hover:shadow-[0_40px_80px_-40px_rgba(43,74,47,0.4)]"
              >
                <span className="absolute right-6 top-5 font-display text-3xl italic text-ink-200 transition-colors group-hover:text-brand-300">
                  0{i + 1}
                </span>
                <span className="grid size-14 place-items-center rounded-2xl bg-surface text-3xl shadow-sm transition-transform duration-300 group-hover:scale-110">
                  {s.icon}
                </span>
                <h3 className="mt-6 font-display text-2xl font-bold text-ink-950">{s.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.tagline}</p>
                <div className="mt-6 flex items-center justify-between pt-4 text-sm">
                  <span className="font-bold text-brand-700">
                    {s.id === "airtime" && `from ${formatLocal(ng.minAirtime, "NGN")}`}
                    {s.id === "data" && "from ₦300 / 500MB"}
                    {s.id === "electricity" && `from ${formatLocal(ng.minElectricity, "NGN")}`}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-ink-400 transition-colors group-hover:text-brand-600">
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
      <section id="how-it-works" className="bg-paper py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">How it works</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink-950 sm:text-5xl">
              Top-up in three quick steps
            </h2>
            <p className="mt-4 text-lg text-ink-500">
              The fastest way to top-up — from choosing to delivered, in under a minute.
            </p>
          </div>

          <div className="relative mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            <div
              className="absolute left-[16.6%] right-[16.6%] top-7 hidden h-px bg-gradient-to-r from-transparent via-ink-200 to-transparent sm:block"
              aria-hidden="true"
            />
            {STEPS.map((step, i) => (
              <div key={step.title} className="relative text-center">
                <span className="relative z-10 mx-auto grid size-14 place-items-center rounded-full bg-surface font-display text-xl font-bold text-brand-700 shadow-lg shadow-ink-900/10">
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
      <section id="countries" className="bg-surface py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Coverage</p>
              <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink-950 sm:text-5xl">
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
                className="group rounded-3xl bg-paper p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:bg-surface hover:shadow-xl hover:shadow-brand-900/10"
              >
                <div className="flex items-center justify-between">
                  <span className="text-4xl transition-transform duration-300 group-hover:scale-110">{c.flag}</span>
                  <span className="rounded-full bg-surface px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-600 shadow-sm">
                    {c.currency}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-ink-950">{c.name}</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c.networks.map((n) => (
                    <span key={n.id} className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-ink-600 shadow-sm">
                      {n.short}
                    </span>
                  ))}
                </div>
                <p className="mt-4 pt-3 text-xs text-ink-400">
                  {c.distributors.length} power utilities · {c.networks.length} networks
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Afritop ──────────────────────────────────────── */}
      <section id="pricing" className="bg-paper py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Why Afritop</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink-950 sm:text-5xl">
              Honest pricing, zero surprises
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-3xl bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-900/10"
              >
                <span className="grid size-11 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-900/20">
                  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-ink-950">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.text}</p>
              </div>
            ))}
          </div>

          {/* FX transparency */}
          <div className="mt-10 flex flex-col items-center justify-between gap-6 rounded-3xl bg-surface p-8 shadow-sm sm:flex-row">
            <div>
              <h3 className="font-display text-xl font-bold text-ink-950">Indicative exchange rates</h3>
              <p className="mt-1 text-sm text-ink-500">
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
                <span key={f.c} className="rounded-xl bg-paper px-4 py-2 font-mono text-sm text-brand-700">
                  {f.c} <span className="text-ink-400">→ $</span>1 · {f.r}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section id="faq" className="bg-surface py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">FAQ</p>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink-950 sm:text-5xl">
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
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-brand-900 px-6 py-16 text-center text-white shadow-2xl shadow-brand-900/30 sm:px-12">
          <div className="bg-grid-dark absolute inset-0" aria-hidden="true" />
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(40rem 24rem at 50% -20%, rgba(226,165,50,0.18), transparent 60%)" }}
            aria-hidden="true"
          />
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
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-sun-400 px-8 py-4 text-base font-extrabold text-ink-950 shadow-xl shadow-sun-500/20 transition-all hover:-translate-y-0.5 hover:bg-sun-300 hover:shadow-2xl"
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

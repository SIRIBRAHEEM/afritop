"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { COUNTRIES, SERVICES, getCountry, findBundle, type ServiceId } from "@/lib/catalog";
import { toUsd, platformFee, round2, formatLocal, formatUsd, FX_RATES } from "@/lib/fx";
import { cn, isValidPhone, isValidMeter } from "@/lib/utils";

function BuyFlow() {
  const searchParams = useSearchParams();
  const cancelled = searchParams.get("cancelled") === "1";

  const [service, setService] = useState<ServiceId>("airtime");
  const [countryCode, setCountryCode] = useState("NG");
  const [providerId, setProviderId] = useState<string>("mtn");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [quick, setQuick] = useState<number | undefined>();
  const [bundleId, setBundleId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const country = useMemo(() => getCountry(countryCode)!, [countryCode]);
  const providers = useMemo(
    () => (service === "electricity" ? country.distributors : country.networks),
    [service, country],
  );
  const provider = useMemo(
    () => providers.find((p) => p.id === providerId) ?? providers[0],
    [providers, providerId],
  );

  const bundle = useMemo(
    () => (service === "data" ? findBundle(country, providerId, bundleId ?? "") : undefined),
    [service, country, providerId, bundleId],
  );

  const recipientValid =
    service === "electricity"
      ? isValidMeter(recipient)
      : isValidPhone(country.phonePrefix, recipient, country.phoneDigits);

  const amountLocal =
    service === "data" ? bundle?.price ?? NaN : Number(amount);

  const amountValid =
    service === "data"
      ? Boolean(bundle)
      : Number.isFinite(amountLocal) &&
        (service === "airtime"
          ? amountLocal >= country.minAirtime && amountLocal <= country.maxAirtime
          : amountLocal >= country.minElectricity && amountLocal <= country.maxElectricity);

  const usdSubtotal = Number.isFinite(amountLocal) ? toUsd(amountLocal, country.currency) : 0;
  const fee = platformFee(usdSubtotal);
  const usdTotal = round2(usdSubtotal + fee);

  const ready = recipientValid && amountValid && Boolean(provider);

  const step = ready ? 3 : recipientValid && amountValid ? 2 : 1;

  function selectCountry(code: string) {
    setCountryCode(code);
    const c = getCountry(code)!;
    setProviderId(service === "electricity" ? c.distributors[0].id : c.networks[0].id);
    setBundleId(undefined);
    setRecipient("");
  }

  function selectService(s: ServiceId) {
    setService(s);
    setBundleId(undefined);
    setProviderId(
      s === "electricity" ? country.distributors[0].id : country.networks[0].id,
    );
  }

  function pickQuick(v: number) {
    setQuick(v);
    setAmount(String(v));
  }

  async function handlePay() {
    if (!ready) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service,
          countryCode,
          providerId: provider!.id,
          recipient,
          amount: service === "data" ? undefined : amountLocal,
          bundleId: service === "data" ? bundleId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      window.location.assign(data.checkoutUrl);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const phonePlaceholder =
    country.code === "NG" ? "801 234 5678" : country.code === "GH" ? "24 123 4567" : country.code === "KE" ? "712 345 678" : "82 123 4567";

  return (
    <div className="bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="animate-fade-up">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Buy top-up</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
            What are we topping up?
          </h1>
          <p className="mt-2 text-ink-500">
            Pick a service, enter the details, pay in USDC — delivered in seconds.
          </p>
        </div>

        {cancelled && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-sun-200 bg-sun-50 px-4 py-3.5 text-sm text-sun-800 animate-fade-in">
            <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            Payment cancelled — no charge was made. Your order is still waiting.
          </div>
        )}

        {/* Stepper */}
        <ol className="mt-8 flex items-center gap-2 sm:gap-3">
          {[
            { n: 1, label: "Service" },
            { n: 2, label: "Details" },
            { n: 3, label: "Pay" },
          ].map((s, i) => (
            <li key={s.n} className="flex items-center gap-2 sm:gap-3">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full text-xs font-extrabold transition-all duration-300",
                  step >= s.n
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30"
                    : "bg-ink-100 text-ink-400",
                )}
              >
                {step > s.n ? "✓" : s.n}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-bold sm:block",
                  step >= s.n ? "text-ink-900" : "text-ink-400",
                )}
              >
                {s.label}
              </span>
              {i < 2 && <span className={cn("h-px w-8 sm:w-14", step > s.n ? "bg-brand-500" : "bg-ink-200")} />}
            </li>
          ))}
        </ol>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          {/* ── Form ── */}
          <div className="space-y-10">
            {/* Service */}
            <section>
              <SectionTitle n={1} title="Choose a service" done />
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {SERVICES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectService(s.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border-2 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                      service === s.id
                        ? "border-brand-500 shadow-lg shadow-brand-600/10"
                        : "border-ink-100 hover:border-ink-200",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-11 shrink-0 place-items-center rounded-xl text-xl transition-colors",
                        service === s.id ? "bg-brand-50" : "bg-ink-100",
                      )}
                    >
                      {s.icon}
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-ink-900">{s.label}</span>
                      <span className="block text-xs text-ink-400">{s.tagline}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Country */}
            <section>
              <SectionTitle n={2} title="Choose a country" done={step >= 2} />
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => selectCountry(c.code)}
                    className={cn(
                      "rounded-2xl border-2 bg-white p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                      countryCode === c.code
                        ? "border-brand-500 shadow-lg shadow-brand-600/10"
                        : "border-ink-100 hover:border-ink-200",
                    )}
                  >
                    <span className="block text-2xl">{c.flag}</span>
                    <span className="mt-1.5 block text-sm font-extrabold text-ink-900">{c.name}</span>
                    <span className="block text-[11px] font-semibold text-ink-400">{c.currency}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Provider */}
            <section>
              <SectionTitle
                n={3}
                title={service === "electricity" ? "Choose your power utility" : "Choose your network"}
                done={step >= 2}
              />
              <div className="mt-4 flex flex-wrap gap-2.5">
                {providers.map((p) => {
                  const active = provider?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProviderId(p.id)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-full border-2 bg-white py-2.5 pl-3.5 pr-5 text-sm font-bold text-ink-700 transition-all duration-200",
                        active
                          ? "border-brand-500 bg-brand-50 text-brand-800 shadow-md shadow-brand-600/10"
                          : "border-ink-100 hover:border-ink-300",
                      )}
                    >
                      <span
                        className="grid size-7 place-items-center rounded-full text-[10px] font-extrabold text-ink-900"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.short.charAt(0)}
                      </span>
                      {p.short}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Recipient */}
            <section>
              <SectionTitle n={4} title={service === "electricity" ? "Meter number" : "Phone number"} done={recipientValid} />
              <div className="mt-4">
                <div
                  className={cn(
                    "flex items-stretch overflow-hidden rounded-2xl border-2 bg-white transition-all duration-200",
                    recipientValid
                      ? "border-brand-400 ring-4 ring-brand-100"
                      : recipient
                        ? "border-red-300 ring-4 ring-red-100"
                        : "border-ink-100 focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100",
                  )}
                >
                  {service !== "electricity" && (
                    <span className="flex items-center gap-1.5 border-r border-ink-100 bg-ink-50 px-4 font-mono text-sm font-bold text-ink-600">
                      {country.phonePrefix}
                    </span>
                  )}
                  <input
                    type="text"
                    inputMode={service === "electricity" ? "numeric" : "tel"}
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder={service === "electricity" ? "e.g. 46230198765" : phonePlaceholder}
                    className="w-full bg-transparent px-4 py-3.5 text-base font-semibold text-ink-900 outline-none placeholder:text-ink-300"
                  />
                  <span className="flex items-center px-4">
                    {recipientValid ? (
                      <svg viewBox="0 0 24 24" className="size-5 text-brand-500" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    ) : recipient ? (
                      <svg viewBox="0 0 24 24" className="size-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 8v4M12 16h.01" />
                      </svg>
                    ) : null}
                  </span>
                </div>
                {recipient && !recipientValid && (
                  <p className="mt-2 text-xs font-semibold text-red-500">
                    {service === "electricity"
                      ? "Enter a valid meter number (6–20 digits)."
                      : `Enter a valid ${country.name} number — ${country.phoneDigits} digits after ${country.phonePrefix}.`}
                  </p>
                )}
              </div>
            </section>

            {/* Amount / Bundle */}
            <section>
              <SectionTitle n={5} title={service === "data" ? "Pick a bundle" : "Amount"} done={amountValid} />
              {service === "data" ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(country.bundles[providerId] ?? []).map((b) => {
                    const active = bundleId === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBundleId(b.id)}
                        className={cn(
                          "flex items-center justify-between rounded-2xl border-2 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                          active
                            ? "border-brand-500 shadow-lg shadow-brand-600/10"
                            : "border-ink-100 hover:border-ink-200",
                        )}
                      >
                        <span>
                          <span className="block text-base font-extrabold text-ink-900">{b.size}</span>
                          <span className="block text-xs text-ink-400">{b.validity}</span>
                        </span>
                        <span className="font-mono text-sm font-bold text-brand-700">
                          {formatLocal(b.price, country.currency)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2.5">
                    {(service === "airtime" ? country.quickAirtime : country.quickElectricity).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => pickQuick(v)}
                        className={cn(
                          "rounded-full border-2 px-4 py-2 font-mono text-sm font-bold transition-all duration-200",
                          quick === v
                            ? "border-brand-500 bg-brand-50 text-brand-800 shadow-md shadow-brand-600/10"
                            : "border-ink-100 bg-white text-ink-600 hover:border-ink-300",
                        )}
                      >
                        {formatLocal(v, country.currency)}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="font-mono text-lg font-bold text-ink-900">{country.currencySymbol}</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setQuick(undefined);
                      }}
                      placeholder="Custom amount"
                      className="w-full max-w-xs rounded-2xl border-2 border-ink-100 bg-white px-4 py-3 text-base font-bold text-ink-900 outline-none transition-all placeholder:font-semibold placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                    />
                  </div>
                  {!Number.isFinite(amountLocal) && amount.length > 0 && (
                    <p className="mt-2 text-xs font-semibold text-red-500">Enter a valid amount.</p>
                  )}
                  {Number.isFinite(amountLocal) && amount.length > 0 && !amountValid && (
                    <p className="mt-2 text-xs font-semibold text-red-500">
                      {service === "airtime"
                        ? `Range: ${formatLocal(country.minAirtime, country.currency)} – ${formatLocal(country.maxAirtime, country.currency)}`
                        : `Range: ${formatLocal(country.minElectricity, country.currency)} – ${formatLocal(country.maxElectricity, country.currency)}`}
                    </p>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* ── Summary ── */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-xl shadow-ink-900/5">
              <h2 className="text-sm font-bold uppercase tracking-widest text-ink-400">Order summary</h2>

              <div className="mt-4 space-y-3 text-sm">
                <Row label="Service" value={`${SERVICES.find((s) => s.id === service)!.icon} ${SERVICES.find((s) => s.id === service)!.label}`} />
                <Row label="Country" value={`${country.flag} ${country.name}`} />
                {provider && <Row label="Provider" value={provider.short} />}
                {recipientValid && <Row label={service === "electricity" ? "Meter" : "Phone"} value={recipient} mono />}
                {bundle && <Row label="Bundle" value={`${bundle.size} · ${bundle.validity}`} />}
                {Number.isFinite(amountLocal) && amountValid && (
                  <Row
                    label="Amount"
                    value={formatLocal(amountLocal, country.currency)}
                    mono
                    strong
                  />
                )}
              </div>

              <div className="mt-5 space-y-2 border-t border-dashed border-ink-200 pt-4 text-sm">
                <Row label="Subtotal" value={formatUsd(usdSubtotal)} mono />
                <Row label="Platform fee (1.5%)" value={formatUsd(fee)} mono />
                <div className="flex items-center justify-between pt-2">
                  <span className="font-display text-lg font-bold text-ink-900">Total</span>
                  <span className="font-mono text-xl font-extrabold text-brand-700">{formatUsd(usdTotal)}</span>
                </div>
                <p className="pt-1 text-[11px] leading-relaxed text-ink-400">
                  Charged in USDC · indicative rate: 1 USD ≈{" "}
                  <span className="font-mono font-bold text-ink-600">
                    {FX_RATES[country.currency]} {country.currency}
                  </span>
                </p>
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 animate-fade-in">
                  {error}
                </div>
              )}

              <button
                type="button"
                disabled={!ready || loading}
                onClick={handlePay}
                className={cn(
                  "mt-5 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-base font-extrabold transition-all duration-300",
                  ready && !loading
                    ? "bg-ink-900 text-white shadow-xl shadow-ink-900/20 hover:-translate-y-0.5 hover:bg-ink-800 hover:shadow-2xl active:translate-y-0"
                    : "cursor-not-allowed bg-ink-100 text-ink-400",
                )}
              >
                {loading ? (
                  <>
                    <Spinner /> Preparing checkout…
                  </>
                ) : ready ? (
                  <>
                    Pay {formatUsd(usdTotal)} with USDC
                  </>
                ) : (
                  "Complete the details to pay"
                )}
              </button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-ink-400">
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                Secure checkout by Circle · USDC
              </p>
            </div>

            {!ready && (
              <p className="mt-4 rounded-2xl border border-ink-100 bg-white px-4 py-3 text-xs leading-relaxed text-ink-400">
                {step === 1
                  ? "👉 Tell us what to top up and the amount above — your total appears here."
                  : "👉 Finish the recipient and amount fields above to unlock checkout."}
              </p>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ n, title, done }: { n: number; title: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "grid size-7 place-items-center rounded-full text-xs font-extrabold",
          done ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-400",
        )}
      >
        {done ? "✓" : n}
      </span>
      <h2 className="font-display text-xl font-bold tracking-tight text-ink-900">{title}</h2>
    </div>
  );
}

function Row({ label, value, mono, strong }: { label: string; value: string; mono?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-ink-500">{label}</span>
      <span
        className={cn(
          "text-right font-semibold text-ink-900",
          mono && "font-mono",
          strong && "text-base font-extrabold text-brand-700",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="size-5 animate-spin" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

export default function BuyPage() {
  return (
    <Suspense>
      <BuyFlow />
    </Suspense>
  );
}

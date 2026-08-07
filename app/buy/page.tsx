"use client";

import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { COUNTRIES, SERVICES, getCountry, findBundle, type ServiceId } from "@/lib/catalog";
import { toUsd, platformFee, round2, formatLocal, formatUsd, FX_RATES } from "@/lib/fx";
import { cn, isValidPhone, isValidMeter } from "@/lib/utils";
import { BrandMark } from "@/components/BrandMark";
import { ServiceIcon } from "@/components/ui/ServiceIcon";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { saveReceipt, updateReceipt } from "@/lib/receipt-journal";
import { USDC_CHAINS } from "@/lib/chains";
import {
  confirmUsdcPayment,
  connectWith,
  ensureChain,
  getDetectedWallets,
  getInjectedProvider,
  humanizeWalletError,
  NO_WALLETS,
  onWalletsChange,
  sendUsdcPayment,
  WALLET_INSTALLS,
  type DetectedWallet,
} from "@/lib/web3";

function BuyFlow() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
  const [payStage, setPayStage] = useState<string | null>(null);
  // Set once the wallet has broadcast a USDC transfer that the server hasn't
  // confirmed yet — powers the "payment sent, still confirming" recovery UI.
  const [txRef, setTxRef] = useState<{
    orderId: string;
    txHash: string;
    chainId: number;
    sender: string;
  } | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletHelp, setWalletHelp] = useState(false);

  // EIP-6963 wallet discovery — re-renders when a wallet extension announces itself.
  const wallets = useSyncExternalStore(onWalletsChange, getDetectedWallets, () => NO_WALLETS);

  // Arc Testnet — the only payment network in the testnet-only phase.
  const payChain = USDC_CHAINS[0];

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

  /** Click handler — the wallet popup fires immediately, then payment completes inline. */
  async function handlePay() {
    if (!ready) return;
    setError(null);
    setWalletHelp(false);
    // Several wallets installed? Let the user pick one — the modal opens
    // synchronously on this click, so there's no popup-blocker delay.
    if (getDetectedWallets().length > 1) {
      setLoading(false);
      setPayStage(null);
      setWalletModalOpen(true);
      return;
    }
    await runWalletPayment();
  }

  async function runWalletPayment(chosen?: DetectedWallet) {
    setLoading(true);
    setPayStage("Connecting your wallet…");
    setError(null);
    try {
      // 1) Wallet popup immediately — before any network request.
      const eth = chosen?.provider ?? getDetectedWallets()[0]?.provider ?? getInjectedProvider();
      if (!eth) {
        setLoading(false);
        setPayStage(null);
        setWalletHelp(true);
        return;
      }
      const conn = await connectWith(eth);

      // 2) Make sure we're on Arc Testnet (adds the chain to the wallet if needed).
      setPayStage("Switching to Arc Testnet…");
      await ensureChain(eth, payChain.chain);

      // 3) Create the order server-side.
      setPayStage("Creating your order…");
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
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }

      // 4) Send the exact USDC amount on-chain.
      setPayStage("Sending USDC…");
      const { txHash } = await sendUsdcPayment({
        provider: eth,
        chain: payChain.chain,
        token: payChain.usdc,
        to: data.receiver,
        amountUsd: usdTotal,
        address: conn.address,
      });

      // Mirror the payment into the local receipt journal immediately — the
      // server store is ephemeral, so the receipt & history must not depend on it.
      saveReceipt({
        id: data.orderId,
        createdAt: new Date().toISOString(),
        status: "paid",
        service,
        countryCode,
        providerId: provider!.id,
        providerShort: provider!.short,
        providerName: provider!.name,
        recipientLabel: service === "electricity" ? "Meter no." : "Phone",
        recipient,
        amountLocal,
        currency: country.currency,
        usdTotal,
        bundle: bundle ? { size: bundle.size, validity: bundle.validity } : undefined,
        txHash,
        chainId: payChain.chain.id,
      });

      // 5) Server-side on-chain verification + fulfillment (authoritative).
      setPayStage("Confirming on-chain…");
      const confirm = await confirmUsdcPayment({
        orderId: data.orderId,
        txHash,
        chainId: payChain.chain.id,
        sender: conn.address,
      });
      if (!confirm.ok) {
        // Broadcast-but-unconfirmed → recovery panel with Check again (never pay
        // twice). Definitive failures (tx reverted, wrong receiver…) show as a
        // plain error instead, so re-paying is safe and immediate.
        if (confirm.retryable) {
          setTxRef({ orderId: data.orderId, txHash, chainId: payChain.chain.id, sender: conn.address });
        } else {
          // Definitive failure (e.g. the tx reverted on-chain) — reflect it.
          updateReceipt(data.orderId, { status: "failed" });
        }
        setError(confirm.error);
        setLoading(false);
        setPayStage(null);
        return;
      }
      updateReceipt(data.orderId, { status: "delivered", token: confirm.token, message: confirm.message });
      setTxRef(null);
      router.push(`/success?orderId=${data.orderId}`);
    } catch (e) {
      setError(humanizeWalletError(e));
      setLoading(false);
      setPayStage(null);
    }
  }

  /** Re-run server-side confirmation for a payment that was already broadcast. */
  async function retryConfirm() {
    if (!txRef) return;
    setLoading(true);
    setPayStage("Confirming on-chain…");
    setError(null);
    try {
      const confirm = await confirmUsdcPayment(txRef);
      if (!confirm.ok) throw new Error(confirm.error);
      updateReceipt(txRef.orderId, { status: "delivered", token: confirm.token, message: confirm.message });
      setTxRef(null);
      router.push(`/success?orderId=${txRef.orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't confirm the payment yet.");
      setLoading(false);
      setPayStage(null);
    }
  }

  const phonePlaceholder =
    country.code === "NG" ? "801 234 5678" : country.code === "GH" ? "24 123 4567" : country.code === "KE" ? "712 345 678" : "82 123 4567";

  return (
    <div className="relative bg-paper">
      {/* Liquid blobs clipped to the page — keeps the sticky summary working */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <span
          className="liquid-blob"
          style={{ background: "radial-gradient(circle, rgba(47,107,255,0.8), rgba(47,107,255,0.15))", width: 380, height: 380, left: -130, top: 120, opacity: 0.22 }}
        />
        <span
          className="liquid-blob"
          style={{ background: "radial-gradient(circle, rgba(255,93,143,0.75), rgba(255,93,143,0.14))", width: 340, height: 340, right: -120, top: "40%", opacity: 0.2, animationDelay: "9s" }}
        />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="animate-fade-up">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-600">Buy top-up</p>
          <h1 className="mt-2 font-display text-h2 font-semibold text-ink-900">
            What are we topping up?
          </h1>
          <p className="mt-2 text-ink-500">
            Pick a service, enter the details, pay in USDC — delivered in seconds.
          </p>
        </div>

        {cancelled && (
          <div className="mt-6 flex items-start gap-3 border-2 border-ink-950 bg-sun-50 px-4 py-3.5 text-sm text-sun-800 animate-fade-in">
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
                  "grid size-8 place-items-center text-xs font-extrabold transition-all duration-300",
                    step >= s.n
                      ? "btn-cta border-2 border-ink-950 bg-night text-[#e6ed0a] shadow-hard-sm"
                      : "border-2 border-ink-950 bg-ink-100 text-ink-400",
                )}
              >
                {step > s.n ? <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg> : s.n}
              </span>
              <span
                className={cn(
                  "hidden text-sm font-bold sm:block",
                  step >= s.n ? "text-ink-950" : "text-ink-400",
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
                    aria-pressed={service === s.id}
                    className={cn(
                      "relative flex items-center gap-3 p-4 text-left transition-all duration-200 hover:-translate-y-0.5",
                      service === s.id ? "glass-strong" : "glass",
                    )}
                  >
                    {service === s.id && <SelectedCheck />}
                    <span
                      className={cn(
                        "grid size-11 shrink-0 place-items-center text-ink-950 transition-all duration-300",
                        service === s.id ? "bg-brand-50 border-2 border-ink-950" : "bg-ink-100 border-2 border-ink-950",
                      )}
                    >
                      <ServiceIcon id={s.id} className="size-6" />
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
                    aria-pressed={countryCode === c.code}
                    className={cn(
                      "relative p-4 text-center transition-all duration-200 hover:-translate-y-0.5",
                      countryCode === c.code ? "glass-strong" : "glass",
                    )}
                  >
                    {countryCode === c.code && <SelectedCheck />}
                    <span className="mx-auto block w-fit origin-center transition-transform duration-300 group-hover:scale-110">
                      <CountryFlag country={c} className="h-9 w-12 border-2 border-ink-950" />
                    </span>
                    <span className="mt-1.5 block text-sm font-extrabold text-ink-900">{c.name}</span>
                    <span className="block text-xs font-bold text-ink-500">{c.currency}</span>
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
                      aria-pressed={active}
                      className={cn(
                        "flex items-center gap-2 py-2.5 pl-3.5 pr-5 text-sm font-bold text-ink-700 transition-all duration-200",
                        active ? "glass-strong text-ink-950" : "glass",
                      )}
                    >
                      <BrandMark logo={p.logo} name={p.name} short={p.short} color={p.color} size={28} />
                      {active && <CheckMark className="text-ink-950" />}
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
                    "flex items-stretch overflow-hidden bg-surface shadow-sm transition-all duration-200",
                    recipientValid
                      ? "ring-2 ring-brand-400 shadow-md"
                      : recipient
                        ? "ring-2 ring-red-300"
                        : "focus-within:ring-2 focus-within:ring-brand-400 focus-within:shadow-md",
                  )}
                >
                  {service !== "electricity" && (
                    <span className="flex items-center gap-1.5 bg-ink-50 px-4 font-mono text-sm font-bold text-ink-600">
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
                      : `Enter a valid ${country.name} number — ${country.phoneDigits} digits after ${country.phonePrefix}, e.g. ${phonePlaceholder}.`}
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
                        aria-pressed={active}
                        className={cn(
                          "relative flex items-center justify-between p-4 text-left transition-all duration-200 hover:-translate-y-0.5",
                          active ? "glass-strong" : "glass",
                        )}
                      >
                        {active && <SelectedCheck />}
                        <span>
                          <span className="block text-base font-extrabold text-ink-900">{b.size}</span>
                          <span className="block text-xs text-ink-400">{b.validity}</span>
                        </span>
                        <span className="pr-1 font-mono text-sm font-bold text-brand-700">
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
                        aria-pressed={quick === v}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-4 py-2 font-mono text-sm font-bold shadow-sm transition-all duration-200",
                          quick === v
                            ? "bg-paper text-ink-950 border-2 border-ink-950 shadow-hard"
                            : "border-2 border-ink-950 bg-surface text-ink-600 shadow-hard-sm hover:shadow-hard",
                        )}
                      >
                        {quick === v && <CheckMark className="text-ink-950" />}
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
                      className="w-full max-w-xs bg-surface px-4 py-3 text-base font-bold text-ink-900 shadow-sm outline-none transition-all placeholder:font-semibold placeholder:text-ink-300 focus:ring-2 focus:ring-brand-400 focus:shadow-md"
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
            <div className="glass-strong p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-ink-400">Order summary</h2>

              <div className="mt-4 space-y-3 text-sm">
                <Row
                  label="Service"
                  icon={<ServiceIcon id={service} className="size-4" />}
                  value={SERVICES.find((s) => s.id === service)!.label}
                />
                <Row
                  label="Country"
                  icon={<CountryFlag country={country} className="h-4 w-6" />}
                  value={country.name}
                />
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

              <div className="mt-5 space-y-2 pt-4 text-sm">
                <Row label="Subtotal" value={formatUsd(usdSubtotal)} mono />
                <Row label="Platform fee (1.5%)" value={formatUsd(fee)} mono />
                <div className="flex items-center justify-between pt-2">
                  <span className="font-display text-lg font-bold text-ink-900">Total</span>
                  <span className="font-mono text-xl font-extrabold text-brand-700">{formatUsd(usdTotal)}</span>
                </div>
                <p className="pt-1 text-xs font-medium leading-relaxed text-ink-500">
                  Charged in USDC · indicative rate: 1 USD ≈{" "}
                  <span className="font-mono font-bold text-ink-600">
                    {FX_RATES[country.currency]} {country.currency}
                  </span>
                </p>
              </div>

              {txRef && (
                <div className="mt-4 border-2 border-ink-950 bg-sun-50 px-4 py-3.5 text-sm text-sun-800 animate-fade-in">
                  <p className="flex items-center gap-2 font-bold text-sun-900">
                    <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                    Payment sent — confirming…
                  </p>
                  <p className="mt-1.5 leading-relaxed">
                    Your USDC transfer was broadcast, but we haven&apos;t confirmed it on-chain yet. If
                    it shows as successful on the explorer, tap <strong>Check again</strong> and
                    we&apos;ll finish your top-up. If it failed on-chain, start a new payment instead —
                    a failed transfer sends nothing.
                  </p>
                  {error && <p className="mt-2 text-xs font-semibold text-sun-900/80">{error}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void retryConfirm()}
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 bg-sun-600 px-4 py-2 text-xs font-extrabold text-white transition-all hover:-translate-y-0.5 hover:bg-sun-700 disabled:cursor-wait disabled:opacity-70 dark:text-night"
                    >
                      {loading ? <Spinner /> : null}
                      {loading ? "Checking…" : "Check again"}
                    </button>
                    <a
                      href={`https://testnet.arcscan.app/tx/${txRef.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-surface px-4 py-2 text-xs font-bold text-ink-700 shadow-sm transition-colors hover:shadow-md"
                    >
                      View on ArcScan ↗
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setTxRef(null);
                        setError(null);
                      }}
                      className="px-2 py-2 text-xs font-bold text-ink-500 underline-offset-2 transition-colors hover:text-ink-700 hover:underline"
                    >
                      New payment instead
                    </button>
                  </div>
                </div>
              )}

              {error && !txRef && (
                <div className="mt-4 border-2 border-ink-950 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 animate-fade-in dark:bg-red-500/15 dark:text-red-400">
                  {error}
                </div>
              )}

              {walletHelp && (
                <div className="mt-4 border-2 border-ink-950 bg-sun-50 px-4 py-3 text-xs leading-relaxed text-sun-800 animate-fade-in">
                  <p className="font-bold">No wallet extension detected.</p>
                  <p className="mt-1">
                    Install a browser wallet to pay USDC on-chain — then click pay again:
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {WALLET_INSTALLS.map((w) => (
                      <a
                        key={w.name}
                        href={w.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-surface px-3 py-1.5 font-bold text-ink-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <BrandMark logo={w.iconUrl} name={w.name} short={w.name} color={w.color} size={22} />
                        <span className="text-xs font-bold">{w.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={!ready || loading || Boolean(txRef)}
                onClick={handlePay}
                className={cn(
                  "mt-5 flex w-full items-center justify-center gap-2 px-6 py-4 text-base font-extrabold transition-all duration-300",
                  ready && !loading && !txRef
                    ? "btn-cta border-2 border-ink-950 bg-night text-white hover:-translate-y-0.5 hover:bg-ink-800 active:translate-y-0"
                    : "cursor-not-allowed border-2 border-ink-950 bg-ink-100 text-ink-400",
                )}
              >
                {loading ? (
                  <>
                    <Spinner /> {payStage ?? "Preparing checkout…"}
                  </>
                ) : ready && !txRef ? (
                  <>
                    Pay {formatUsd(usdTotal)} with USDC
                  </>
                ) : txRef ? (
                  "Payment sent — check again above"
                ) : (
                  "Complete the details to pay"
                )}
              </button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-ink-500">
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
                Secure checkout by Circle · USDC
              </p>
            </div>

            {!ready && (
              <p className="mt-4 border-2 border-ink-950 bg-ink-50 px-4 py-3 text-xs leading-relaxed text-ink-400">
                {step === 1
                  ? "Tell us what to top up and the amount above — your total appears here."
                  : "Finish the recipient and amount fields above to unlock checkout."}
              </p>
            )}
          </aside>
        </div>
      </div>

      {/* Wallet chooser — shown when several wallets are installed */}
      {walletModalOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          onClick={() => setWalletModalOpen(false)}
        >
          <div
            className="w-full max-w-sm border-2 border-ink-950 bg-surface p-6 animate-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-ink-900">Choose a wallet</h3>
              <button
                type="button"
                onClick={() => setWalletModalOpen(false)}
                className="grid size-8 place-items-center border-2 border-ink-950 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-950"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-4 space-y-2">
              {wallets.length === 0 && (
                <p className="bg-ink-50 px-4 py-3 text-xs text-ink-500">
                  No wallets detected yet — open your wallet extension and try again.
                </p>
              )}
              {wallets.map((w) => (
                <button
                  key={w.uuid}
                  type="button"
                  onClick={() => {
                    setWalletModalOpen(false);
                    void runWalletPayment(w);
                  }}
                  className="flex w-full items-center gap-3 border-2 border-ink-950 bg-surface px-4 py-3 text-left transition-all hover:-translate-y-0.5"
                >
                  <BrandMark logo={w.icon} name={w.name} short={w.name} color="#E7E5DF" size={32} />
                  <span className="text-sm font-extrabold text-ink-950">{w.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Small check icon used inside selection markers. */
function CheckMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-3.5", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** Corner sticker that marks a card as selected — night tile with a lime check. */
function SelectedCheck() {
  return (
    <span className="absolute -right-1.5 -top-1.5 z-10 grid size-6 place-items-center border-2 border-ink-950 bg-night text-sun-300">
      <CheckMark className="size-3" />
    </span>
  );
}

function SectionTitle({ n, title, done }: { n: number; title: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "grid size-7 place-items-center text-xs font-extrabold",
          done ? "bg-brand-600 text-white dark:text-night" : "bg-ink-100 text-ink-400",
        )}
      >                {done ? <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg> : n}
      </span>
      <h2 className="font-display text-xl font-bold tracking-tight text-ink-900">{title}</h2>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  strong,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  strong?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-ink-500">{label}</span>
      <span
        className={cn(
          "flex items-center justify-end gap-2 text-right font-semibold text-ink-900",
          mono && "font-mono",
          strong && "text-base font-extrabold text-brand-700",
        )}
      >
        {icon}
        <span>{value}</span>
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

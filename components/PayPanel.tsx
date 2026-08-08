"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { createWalletClient, custom, getAddress, parseUnits, type EIP1193Provider } from "viem";
import { USDC_CHAINS, ERC20_TRANSFER_ABI, getUsdcChain, type UsdcChain } from "@/lib/chains";
import { confirmUsdcPayment, WALLET_INSTALLS, withTimeout } from "@/lib/web3";
import { BrandMark } from "@/components/BrandMark";
import { QrPayPanel } from "@/components/QrPayPanel";
import { getReceiptsSnapshot, saveReceipt, subscribeReceipts, updateReceipt } from "@/lib/receipt-journal";
import { formatLocal, formatUsd } from "@/lib/fx";
import { cn, shortenAddress } from "@/lib/utils";

export interface PayPanelOrder {
  id: string;
  usdTotal: number;
  service: string;
  provider: string;
  providerId: string;
  providerName: string;
  recipient: string;
  recipientLabel: string;
  amountLocal: number;
  currency: string;
  countryCode: string;
  receiver: string;
}

interface PayPanelProps {
  order: PayPanelOrder;
  demoMode: boolean;
  circleConfigured: boolean;
  cancelled: boolean;
}

type Busy = "connecting" | "switching" | "sending" | "confirming" | "circle" | "simulating" | null;

interface WalletState {
  address: string;
  chainId: number;
}

function hasEthereum(): boolean {
  return typeof window !== "undefined" && Boolean((window as { ethereum?: unknown }).ethereum);
}

function humanizeError(err: unknown): string {
  const e = err as { code?: number; message?: string; shortMessage?: string };
  if (e?.code === 4001) return "You rejected the transaction in your wallet.";
  if (e?.code === 4902) return "This network isn't in your wallet yet.";
  const msg = e?.message ?? "";
  if (/insufficient funds|insufficient balance/i.test(msg)) {
    return "Your wallet doesn't have enough USDC (plus gas) to cover this payment.";
  }
  if (e?.shortMessage) return e.shortMessage;
  if (msg) return msg.split("\n")[0];
  return "Something went wrong with the wallet request.";
}

export function PayPanel({ order, demoMode, circleConfigured, cancelled }: PayPanelProps) {
  const router = useRouter();
  // Client-side copy of this order (saved by /buy before navigating). Sent with
  // confirmations so the server can rebuild the order if its ephemeral store
  // lost it, keeping the wallet flow working on serverless platforms.
  const receipts = useSyncExternalStore(subscribeReceipts, getReceiptsSnapshot, () => null);
  const journalEntry = receipts?.find((r) => r.id === order.id);
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [selectedChainId, setSelectedChainId] = useState<number>(USDC_CHAINS[0].chain.id);
  const [busy, setBusy] = useState<Busy>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Set once the wallet has broadcast a USDC transfer the server hasn't
  // confirmed yet — powers the "payment sent, still confirming" recovery UI.
  const [lastConfirm, setLastConfirm] = useState<{
    orderId: string;
    txHash: string;
    chainId: number;
    sender: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  // Which payment method is shown: connect a browser wallet, or scan a QR /
  // copy the address and send USDC from any wallet (incl. phone wallet apps).
  // This page is reached from the "Pay by QR code" path, so the QR / copy
  // address view — with its automatic watcher — is the default.
  const [payMethod, setPayMethod] = useState<"wallet" | "scan">("scan");

  const selectedChain = useMemo(
    () => USDC_CHAINS.find((c) => c.chain.id === selectedChainId) ?? USDC_CHAINS[0],
    [selectedChainId],
  );

  const walletMatchesChain = wallet && wallet.chainId === selectedChain.chain.id;
  const connected = Boolean(wallet);
  // Never allow paying on a mainnet chain while the receiver is still the demo burn address.
  const lockedSelected = demoMode && !selectedChain.testnet;
  const ready = connected && walletMatchesChain && !busy && !lockedSelected && !lastConfirm;
  // Chain the broadcast tx actually happened on (user may have switched networks since).
  const confirmChain = lastConfirm ? getUsdcChain(lastConfirm.chainId) ?? selectedChain : null;

  async function connect() {
    setBusy("connecting");
    setError(null);
    if (!hasEthereum()) {
      setBusy(null);
      setShowInstallHelp(true);
      return;
    }
    try {
      const ethereum = (window as unknown as { ethereum: EIP1193Provider }).ethereum;
      const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
      if (!accounts?.length) throw new Error("No accounts returned by the wallet.");
      const address = getAddress(accounts[0]);
      const chainId = Number(await ethereum.request({ method: "eth_chainId" }));
      // Auto-select the wallet's chain only when it's allowed (never a mainnet
      // chain while in demo mode — otherwise real USDC could go to the burn address).
      const active = USDC_CHAINS.find((c) => c.chain.id === chainId);
      if (active && (!demoMode || active.testnet)) setSelectedChainId(active.chain.id);
      setWallet({ address, chainId });
    } catch (e) {
      setError(humanizeError(e));
    } finally {
      setBusy(null);
    }
  }

  async function switchChain(c: UsdcChain) {
    if (!hasEthereum()) return;
    if (!wallet) {
      setSelectedChainId(c.chain.id);
      return;
    }
    setBusy("switching");
    setError(null);
    try {
      const ethereum = (window as unknown as { ethereum: EIP1193Provider }).ethereum;
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${c.chain.id.toString(16)}` }],
        });
      } catch (err) {
        const e = err as { code?: number };
        if (e?.code === 4902) {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${c.chain.id.toString(16)}`,
                chainName: c.chain.name,
                nativeCurrency: c.chain.nativeCurrency,
                rpcUrls: [...(c.chain.rpcUrls.default?.http ?? [])],
                blockExplorerUrls: c.chain.blockExplorers ? [c.chain.blockExplorers.default.url] : [],
              },
            ],
          });
        } else {
          throw err;
        }
      }
      setSelectedChainId(c.chain.id);
      setWallet((w) => (w ? { ...w, chainId: c.chain.id } : w));
    } catch (e) {
      setError(humanizeError(e));
    } finally {
      setBusy(null);
    }
  }

  async function payWithWallet() {
    if (!wallet || !walletMatchesChain || !order.receiver) return;
    setBusy("sending");
    setError(null);
    setTxHash(null);
    setLastConfirm(null);
    try {
      const ethereum = (window as unknown as { ethereum: EIP1193Provider }).ethereum;
      const walletClient = createWalletClient({ chain: selectedChain.chain, transport: custom(ethereum) });
      const [address] = await walletClient.getAddresses();
      // Hard cap on the wallet popup so a stuck wallet (e.g. one whose Arc RPC
      // is unreachable) can never leave the UI frozen on "Sending USDC…".
      const hash = await withTimeout(
        walletClient.writeContract({
          address: selectedChain.usdc,
          abi: ERC20_TRANSFER_ABI,
          functionName: "transfer",
          args: [order.receiver as `0x${string}`, parseUnits(order.usdTotal.toFixed(2), 6)],
          account: address,
        }),
        60_000,
        "Your wallet is taking too long to send the payment. If you already approved it, check testnet.arcscan.app before trying again.",
      );
      setTxHash(hash);
      setBusy("confirming");

      // Mirror the payment into the local receipt journal immediately — the
      // server store is ephemeral, so the receipt & history must not depend on it.
      saveReceipt({
        id: order.id,
        createdAt: new Date().toISOString(),
        status: "paid",
        service: order.service,
        countryCode: order.countryCode,
        providerId: order.providerId,
        providerShort: order.provider,
        providerName: order.providerName,
        recipientLabel: order.recipientLabel,
        recipient: order.recipient,
        amountLocal: order.amountLocal,
        currency: order.currency,
        usdTotal: order.usdTotal,
        txHash: hash,
        chainId: selectedChain.chain.id,
      });

      // No client-side receipt wait: the browser's link to a public RPC is the
      // most failure-prone hop (CORS, rate limits), and viem's default wait is
      // 180 seconds. The server verifies on-chain with multi-RPC failover.
      // Server-side on-chain verification + fulfillment (authoritative).
      const confirm = await confirmUsdcPayment({
        orderId: order.id,
        txHash: hash,
        chainId: selectedChain.chain.id,
        sender: address,
        order: journalEntry,
      });
      if (!confirm.ok) {
        // Broadcast-but-unconfirmed → recovery panel with Check again (never pay
        // twice). Definitive failures (tx reverted, wrong receiver…) show as a
        // plain error instead, so re-paying is safe and immediate.
        if (confirm.retryable) {
          setLastConfirm({ orderId: order.id, txHash: hash, chainId: selectedChain.chain.id, sender: address });
        } else {
          // Definitive failure (e.g. the tx reverted on-chain) — reflect it.
          updateReceipt(order.id, { status: "failed" });
        }
        setBusy(null);
        setError(confirm.error);
        return;
      }
      updateReceipt(order.id, { status: "delivered", token: confirm.token, message: confirm.message });
      setLastConfirm(null);
      router.push(`/success?orderId=${order.id}`);
    } catch (e) {
      setBusy(null);
      setError(humanizeError(e));
    }
  }

  /** Re-run server-side confirmation for a payment that was already broadcast. */
  async function retryConfirm() {
    if (!lastConfirm) return;
    setBusy("confirming");
    setError(null);
    try {
      const confirm = await confirmUsdcPayment({ ...lastConfirm, order: journalEntry });
      if (!confirm.ok) throw new Error(confirm.error);
      updateReceipt(lastConfirm.orderId, { status: "delivered", token: confirm.token, message: confirm.message });
      setLastConfirm(null);
      router.push(`/success?orderId=${lastConfirm.orderId}`);
    } catch (e) {
      setBusy(null);
      setError(e instanceof Error ? e.message : "Couldn't confirm the payment yet.");
    }
  }

  async function payWithCircle() {
    setBusy("circle");
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: "circle", orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBusy(null);
        setError(data.error ?? "Circle checkout is unavailable.");
        return;
      }
      window.location.assign(data.checkoutUrl);
    } catch {
      setBusy(null);
      setError("Network error. Please try again.");
    }
  }

  async function simulatePayment() {
    setBusy("simulating");
    setError(null);
    try {
      const res = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBusy(null);
        setError(data.error ?? "Simulation failed.");
        return;
      }
      router.push(`/success?orderId=${order.id}`);
    } catch {
      setBusy(null);
      setError("Network error. Please try again.");
    }
  }

  async function copyReceiver() {
    try {
      await navigator.clipboard.writeText(order.receiver);
    } catch {
      /* clipboard may be unavailable */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex-1 bg-paper">
      <div className="mx-auto max-w-lg px-4 py-10 sm:py-14">
        {cancelled && (
          <div className="mb-6 flex items-start gap-3 bg-sun-50 px-4 py-3.5 text-sm text-sun-800 animate-fade-in">
            <svg viewBox="0 0 24 24" className="mt-0.5 size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            Payment cancelled. No charge was made.
          </div>
        )}

        {/* Order summary */}
        <div className="animate-fade-up overflow-hidden border-2 border-ink-950 bg-surface">
          <div className="border-b-2 border-ink-950 bg-night px-7 py-6 text-white">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                Order {order.id}
              </p>
              <span className="border-2 border-ink-950 bg-surface px-3 py-1 text-[11px] font-bold text-ink-950">
                Awaiting payment
              </span>
            </div>
            <p className="mt-4 font-mono text-4xl font-bold tracking-tight text-white">
              {formatUsd(order.usdTotal)}
              <span className="ml-2 text-sm font-semibold text-white/60">USDC</span>
            </p>
            <p className="mt-1 text-sm capitalize text-white/60">
              {order.service} · {order.provider} · {order.recipientLabel} {order.recipient}
            </p>
          </div>
          <div className="flex items-center justify-between px-7 py-4 text-sm">
            <span className="text-ink-500">{order.provider} top-up</span>
            <span className="font-mono font-bold text-ink-900">
              {formatLocal(order.amountLocal, order.currency)}
            </span>
          </div>
        </div>

        {/* Payment */}
        <div className="mt-6 border-2 border-ink-950 bg-surface p-6 sm:p-7">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-ink-900">
              Pay with USDC
            </h2>
            <span className="grid size-10 place-items-center border-2 border-ink-950 bg-brand-50 text-ink-950">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
                <path d="M3 10h18" />
              </svg>
            </span>
          </div>

          {/* Payment method tabs */}
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPayMethod("wallet")}
              aria-pressed={payMethod === "wallet"}
              className={cn(
                "flex items-center justify-center gap-2 px-3 py-3 text-sm font-extrabold transition-all duration-200",
                payMethod === "wallet"
                  ? "border-2 border-ink-950 bg-night text-white"
                  : "border-2 border-ink-950 bg-ink-50 text-ink-500 hover:text-ink-950",
              )}
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-9-9" />
                <path d="M21 3v6h-6" />
              </svg>
              Connect wallet
            </button>
            <button
              type="button"
              onClick={() => setPayMethod("scan")}
              aria-pressed={payMethod === "scan"}
              className={cn(
                "flex items-center justify-center gap-2 px-3 py-3 text-sm font-extrabold transition-all duration-200",
                payMethod === "scan"
                  ? "border-2 border-ink-950 bg-night text-white"
                  : "border-2 border-ink-950 bg-ink-50 text-ink-500 hover:text-ink-950",
              )}
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
                <path d="M7 12h10" />
              </svg>
              Scan QR / copy address
            </button>
          </div>

          {payMethod === "wallet" ? (
            <>
          {/* Network picker */}
          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-ink-400">Pay on</p>
          <div className="mt-2.5 grid grid-cols-3 gap-2">
            {USDC_CHAINS.map((c) => {
              const locked = demoMode && !c.testnet;
              const active = selectedChainId === c.chain.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  disabled={locked || busy === "switching"}
                  onClick={() => void switchChain(c)}
                  className={cn(
                    "relative rounded-md px-2.5 py-2.5 text-center transition-all duration-200",
                    active
                      ? "bg-brand-50 border-2 border-ink-950"
                      : "bg-surface border-2 border-ink-950",
                    locked && "cursor-not-allowed opacity-50",
                  )}
                >
                  <span className={cn("block text-sm font-extrabold", active ? "text-brand-800" : "text-ink-400")}>
                    {c.short}
                  </span>
                  <span className={cn("block text-[11px] font-bold", active ? "text-brand-600" : "text-ink-500")}>
                    {c.testnet ? "Testnet" : "Mainnet"}
                  </span>
                  {locked && (
                    <span className="absolute right-1.5 top-1.5" title="Set USDC_RECEIVER to enable mainnet">
                      <svg viewBox="0 0 24 24" className="size-3 text-ink-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="10" width="16" height="11" rx="2" />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-ink-400">{selectedChain.blurb}</p>

          {selectedChain.testnet && selectedChain.faucetUrl && (
            <a
              href={selectedChain.faucetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-600"
            >
              <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2v6m4-6v6M7 8h10l-1 12H8L7 8Zm-2 5h14" />
              </svg>
              Get free testnet USDC from the Circle faucet
            </a>
          )}

          {/* Connect / pay */}
          <div className="mt-6 space-y-3">
            {!wallet ? (
              <>
                <button
                  type="button"
                  onClick={() => void connect()}
                  disabled={busy === "connecting"}
                  className="btn-cta flex w-full items-center justify-center gap-2 border-2 border-ink-950 bg-night px-6 py-4 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-ink-800 disabled:cursor-wait disabled:opacity-70"
                >
                  {busy === "connecting" ? <Spinner /> : null}
                  {busy === "connecting" ? "Waiting for your wallet…" : "Connect wallet"}
                </button>

                {showInstallHelp && (
                  <div className="bg-sun-50 p-4 text-sm text-sun-800 animate-fade-in">
                    <p className="font-bold">No wallet extension detected.</p>
                    <p className="mt-1 leading-relaxed">
                      Install a browser wallet to pay USDC on-chain, then click{" "}
                      <strong>Connect wallet</strong> again:
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {WALLET_INSTALLS.map((w) => (
                        <a
                          key={w.name}
                          href={w.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-surface px-3 py-2.5 font-bold text-ink-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <BrandMark logo={w.iconUrl} name={w.name} short={w.name} color={w.color} size={24} />
                          <span className="text-xs">{w.name}</span>
                        </a>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => void connect()}
                      disabled={busy === "connecting"}
                      className="mt-3 text-xs font-bold text-brand-700 hover:text-brand-600"
                    >
                      I&apos;ve installed a wallet. Try again →
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between border-2 border-ink-950 bg-ink-50 px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex size-2.5">
                      <span className="absolute inline-flex size-2.5 rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="font-mono text-sm font-bold text-ink-900">{shortenAddress(wallet.address)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWallet(null)}
                    className="text-xs font-bold text-ink-400 transition-colors hover:text-ink-600"
                  >
                    Disconnect
                  </button>
                </div>

                {!walletMatchesChain && (
                  <p className="bg-sun-50 px-4 py-2.5 text-xs font-semibold text-sun-800">
                    Your wallet is on another network. Pick <strong>{selectedChain.label}</strong> above and
                    we&apos;ll prompt your wallet to switch.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => void payWithWallet()}
                  disabled={!ready}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-md px-6 py-4 text-base font-bold transition-all duration-300",
                    ready
                      ? "btn-cta border-2 border-ink-950 bg-night text-white hover:-translate-y-0.5 active:translate-y-0"
                      : "cursor-not-allowed border-2 border-ink-950 bg-ink-100 text-ink-400",
                  )}
                >
                  {busy === "sending" || busy === "confirming" ? <Spinner /> : null}
                  {busy === "sending" && "Waiting for your approval…"}
                  {busy === "confirming" && "Confirming on-chain…"}
                  {!busy && !lastConfirm && `Pay ${formatUsd(order.usdTotal)} USDC`}
                  {!busy && lastConfirm && "Payment sent. Check again above"}
                </button>
              </>
            )}
          </div>

          {/* Status / tx link */}
          {txHash && (
            <a
              href={selectedChain.explorerTx(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-between border-2 border-ink-950 bg-brand-50 px-4 py-3 text-sm animate-fade-in"
            >
              <span className="flex items-center gap-2 font-bold text-brand-800">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Transaction submitted
              </span>
              <span className="font-mono text-xs text-brand-700 hover:underline">
                View on {selectedChain.short}
              </span>
            </a>
          )}

          {error && (
            <div className="mt-4 border-2 border-ink-950 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 animate-fade-in dark:bg-red-500/15 dark:text-red-400">
              {error}
            </div>
          )}

          {lastConfirm && (
            <div className="mt-4 border-2 border-ink-950 bg-sun-50 px-4 py-3.5 text-sm text-sun-800 animate-fade-in">
              <p className="flex items-center gap-2 font-bold text-sun-900">
                <svg viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                Payment sent. Confirming…
              </p>
              <p className="mt-1.5 leading-relaxed">
                Your USDC transfer was broadcast, but on-chain confirmation is taking longer than
                usual. If it shows as successful on the explorer, tap <strong>Check again</strong>
                and we&apos;ll finish your top-up. If it failed on-chain, start a new payment instead.
                A failed transfer sends nothing.
              </p>
              {error && <p className="mt-2 text-xs font-semibold text-sun-900/80">{error}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void retryConfirm()}
                  disabled={busy === "confirming"}
                  className="inline-flex items-center gap-1.5 border-2 border-ink-950 bg-sun-600 px-4 py-2 text-xs font-extrabold text-white transition-all hover:-translate-y-0.5 hover:bg-sun-700 disabled:cursor-wait disabled:opacity-70 dark:text-night"
                >
                  {busy === "confirming" ? <Spinner /> : null}
                  {busy === "confirming" ? "Checking…" : "Check again"}
                </button>
                <a
                  href={confirmChain?.explorerTx(lastConfirm.txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-2 border-ink-950 bg-surface px-4 py-2 text-xs font-bold text-ink-700 shadow-sm transition-colors hover:shadow-md"
                >
                  View on {confirmChain?.short ?? "explorer"} ↗
                </a>
              </div>
            </div>
          )}

          {/* Receiver */}
          <div className="mt-5 border-2 border-ink-950 bg-ink-50/70 px-4 py-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-ink-500">
                Paying to (receiver)
              </p>
              <button
                type="button"
                onClick={() => void copyReceiver()}
                className="text-xs font-bold text-brand-700 hover:text-brand-600"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="mt-1 break-all font-mono text-xs font-semibold text-ink-700">{order.receiver}</p>
          </div>
            </>
          ) : (
            <QrPayPanel order={order} />
          )}
        </div>

        {/* Alternatives */}
        <div className="mt-6 space-y-3">
          {circleConfigured && (
            <button
              type="button"
              onClick={() => void payWithCircle()}
              disabled={busy === "circle"}
              className="flex w-full items-center justify-center gap-2 border-2 border-ink-950 bg-surface px-6 py-3.5 text-sm font-bold text-ink-950 transition-all hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
            >
              {busy === "circle" ? <Spinner /> : null}
              {busy === "circle" ? "Preparing Circle checkout…" : "Or pay with Circle (hosted checkout)"}
            </button>
          )}
          {demoMode && (
            <button
              type="button"
              onClick={() => void simulatePayment()}
              disabled={busy === "simulating"}
              className="flex w-full items-center justify-center gap-2 border-2 border-transparent px-6 py-3 text-sm font-bold text-ink-400 transition-colors hover:border-ink-950 hover:bg-surface hover:text-ink-950 disabled:cursor-wait disabled:opacity-70"
            >
              {busy === "simulating" ? <Spinner /> : null}
              {busy === "simulating" ? "Simulating…" : "Demo mode: simulate payment"}
            </button>
          )}
        </div>

        {demoMode && (
          <p className="mt-4 border-2 border-ink-950 bg-sun-50 px-4 py-3 text-xs leading-relaxed text-sun-800">
            <strong>Testnet-only phase.</strong> Payments run on Arc Testnet. QR payments go to a
            unique address generated for each order; connect-wallet payments go to{" "}
            <code className="font-mono">USDC_RECEIVER</code> when set, otherwise the demo burn address.
          </p>
        )}          <p className="mt-6 text-center text-xs font-bold text-ink-400">
            <svg viewBox="0 0 24 24" className="inline size-3.5 -mt-0.5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            Payment confirmed on-chain before your top-up is delivered.
          </p>
      </div>
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

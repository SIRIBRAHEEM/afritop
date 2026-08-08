"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { USDC_CHAINS, paymentRequestUri } from "@/lib/chains";
import {
  getReceiptsSnapshot,
  saveReceipt,
  subscribeReceipts,
  updateReceipt,
} from "@/lib/receipt-journal";
import { formatUsd } from "@/lib/fx";

/**
 * QR / manual-transfer payment panel for the /pay page.
 *
 * Lets users pay without connecting a browser wallet:
 *  - scan an EIP-681 payment-request QR with a phone wallet app, or
 *  - copy the receiver address and send USDC from any wallet.
 *
 * The server watches the receiver address (/api/scan-usdc) and the moment a
 * matching transfer lands, the order is confirmed, delivered and the receipt
 * is saved. We auto-poll while the panel is open, so the user doesn't even
 * have to press a button after sending.
 */

export interface QrPayOrder {
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

interface QrPayPanelProps {
  order: QrPayOrder;
}

const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;
const POLL_MS = 6000;

export function QrPayPanel({ order }: QrPayPanelProps) {
  const router = useRouter();
  const chain = USDC_CHAINS[0]; // Arc Testnet — the only payment network right now
  // The client-side copy of this order (saved by /buy before navigating). Sent
  // with every check so the server can recreate the order if its ephemeral
  // store lost it, keeping fulfillment working on serverless platforms.
  const receipts = useSyncExternalStore(subscribeReceipts, getReceiptsSnapshot, () => null);
  const journalEntry = receipts?.find((r) => r.id === order.id);

  const [txHashInput, setTxHashInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const checkingRef = useRef(false);
  const doneRef = useRef(false);
  const stopRef = useRef(false);
  const txHashRef = useRef("");

  const qrValue = paymentRequestUri({
    chainId: chain.chain.id,
    token: chain.usdc,
    to: order.receiver,
    amountUsd: order.usdTotal,
  });

  async function checkPayment(silent = false) {
    if (checkingRef.current || doneRef.current || stopRef.current) return;
    checkingRef.current = true;
    if (!silent) {
      setChecking(true);
      setError(null);
    }
    try {
      const raw = txHashRef.current.trim();
      const txHash = TX_HASH_RE.test(raw) ? raw : undefined;
      const res = await fetch("/api/scan-usdc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          chainId: chain.chain.id,
          txHash,
          order: journalEntry,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        doneRef.current = true;
        setConfirmed(true);
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
          txHash: data.txHash ?? txHash,
          chainId: chain.chain.id,
          paymentMethod: "wallet",
        });
        updateReceipt(order.id, {
          status: "delivered",
          token: data.order?.token,
          message: data.order?.message,
        });
        router.push(`/success?orderId=${order.id}`);
        return;
      }
      // Silent polls don't flash the amber box — the "Watching…" line below
      // already communicates the waiting state. Manual checks always report.
      if (!silent) setError(data.error ?? "We couldn't confirm the payment yet.");
      // Definitive failures (wrong receiver, reverted tx, used hash, dead
      // order…) are never going to fix themselves — stop polling.
      if (data.retryable === false || res.status === 400 || res.status === 403 || res.status === 404) {
        stopRef.current = true;
        if (silent) setError(data.error ?? "The payment couldn't be confirmed.");
      }
    } catch {
      if (!silent) setError("Network error. Please try again.");
    } finally {
      checkingRef.current = false;
      if (!silent) setChecking(false);
    }
  }

  // While this panel is open, keep watching the receiver address for the
  // payment. An immediate first check catches a payment that already landed
  // (e.g. the page was reloaded after sending), then poll. Stops on confirm
  // or unmount.
  useEffect(() => {
    let cancelled = false;
    // Check once right away — catches a payment that already landed (e.g. the
    // page was reloaded after sending) — then keep polling. The first call is
    // deferred past the synchronous effect body so it can never set state
    // mid-render.
    const first = (async () => {
      await new Promise((r) => setTimeout(r, 0));
      if (!cancelled) await checkPayment(true);
    })();
    void first;
    const id = setInterval(() => void checkPayment(true), POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id, chain.chain.id]);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(order.receiver);
    } catch {
      /* clipboard may be unavailable */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mt-6 space-y-5">
      {/* QR scan-to-pay */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-ink-400">
          Scan to pay from your phone
        </p>
        <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div
            className="shrink-0 border-2 border-ink-950 bg-white p-4 shadow-hard-sm transition-transform duration-300 hover:scale-[1.02]"
            role="img"
            aria-label={`QR code to pay ${formatUsd(order.usdTotal)} USDC to ${order.receiver}`}
          >
            <QRCode value={qrValue} size={176} bgColor="#ffffff" fgColor="#0a0a0a" />
          </div>
          <div className="w-full space-y-2.5">
            <p className="rounded-md border-2 border-ink-950 bg-ink-50 px-3.5 py-2.5 text-sm text-ink-700">
              Open your wallet app on your phone and scan this code. It
              pre-fills the recipient and the exact amount.
            </p>
            <p className="font-mono text-lg font-extrabold text-brand-700">
              {formatUsd(order.usdTotal)} USDC
            </p>
            <p className="text-xs font-semibold text-ink-500">
              on {chain.label} ({chain.short} Testnet)
            </p>
          </div>
        </div>
      </div>

      {/* Manual transfer: copy the address */}
      <div className="border-2 border-ink-950 bg-ink-50/60 px-4 py-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-500">
            Or send manually from any wallet
          </p>
          <button
            type="button"
            onClick={() => void copyAddress()}
            className="text-xs font-bold text-brand-700 transition-colors hover:text-brand-600"
          >
            {copied ? "Copied!" : "Copy address"}
          </button>
        </div>
        <p className="mt-2 break-all font-mono text-xs font-semibold leading-relaxed text-ink-700">
          {order.receiver}
        </p>
        <ol className="mt-3 list-inside list-decimal space-y-1 text-xs font-semibold leading-relaxed text-ink-600">
          <li>
            In your wallet, send <strong className="text-ink-900">{formatUsd(order.usdTotal)} USDC</strong> on{" "}
            <strong className="text-ink-900">{chain.label} Testnet</strong> (chain id {chain.chain.id}).
          </li>
          <li>
            Paste the address above as the recipient. The USDC contract is{" "}
            <code className="font-mono">{chain.usdc}</code>.
          </li>
          <li>
            Confirm the send. This page watches for your payment and finishes
            the top-up automatically.
          </li>
        </ol>
      </div>

      {/* Confirm: optional tx hash + check button */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-ink-400">
          Paid already? Paste the transaction hash
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={txHashInput}
            onChange={(e) => {
              const v = e.target.value;
              setTxHashInput(v);
              txHashRef.current = v;
            }}
            placeholder="0x…"
            className="w-full flex-1 border-2 border-ink-950 bg-surface px-3.5 py-2.5 font-mono text-xs font-semibold text-ink-900 outline-none transition-shadow placeholder:text-ink-300 focus:ring-2 focus:ring-brand-400"
          />
          <button
            type="button"
            onClick={() => void checkPayment(false)}
            disabled={checking}
            className="inline-flex items-center justify-center gap-2 border-2 border-ink-950 bg-night px-5 py-2.5 text-sm font-extrabold text-white transition-all hover:-translate-y-0.5 hover:bg-ink-800 disabled:cursor-wait disabled:opacity-70"
          >
            {checking ? <Spinner /> : null}
            {checking ? "Checking…" : "Check now"}
          </button>
        </div>
        {txHashInput && !TX_HASH_RE.test(txHashInput.trim()) && (
          <p className="mt-1.5 text-xs font-semibold text-red-500">
            That doesn&apos;t look like a transaction hash (0x followed by 64 hex characters).
          </p>
        )}
      </div>

      {/* Watching / status */}
      {!confirmed && (
        <div className="flex items-center gap-2.5 text-xs font-bold text-ink-500">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-2.5 animate-ping rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex size-2.5 rounded-full bg-brand-500" />
          </span>
          Watching for your payment… it lands within seconds of sending.
        </div>
      )}

      {error && (
        <div className="border-2 border-ink-950 bg-sun-50 px-4 py-3 text-sm font-semibold text-sun-800 animate-fade-in">
          {error}
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="size-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}

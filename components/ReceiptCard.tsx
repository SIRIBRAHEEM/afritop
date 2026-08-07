"use client";

import { useState } from "react";
import Link from "next/link";
import { formatLocal, formatUsd } from "@/lib/fx";
import { getUsdcChain } from "@/lib/chains";
import { StatusChip } from "@/components/StatusChip";
import type { ReceiptEntry } from "@/lib/receipt-journal";

function txExplorerLink(txHash: string, chainId?: number): string {
  const chain = chainId ? getUsdcChain(chainId) : undefined;
  return chain ? chain.explorerTx(txHash) : `https://etherscan.io/tx/${txHash}`;
}

/** One receipt card — used by /success (server order or journal fallback). */
export function ReceiptCard({ entry }: { entry: ReceiptEntry }) {
  const delivered = entry.status === "delivered";
  const failed = entry.status === "failed";

  return (
    <div className="flex-1 bg-paper">
      <div className="mx-auto max-w-xl px-4 py-14 sm:py-20">
        <div className="animate-pop overflow-hidden border-2 border-ink-950 bg-surface">
          {/* Header */}
          <div
            className={
              delivered
                ? "border-b-2 border-ink-950 bg-night px-7 py-10 text-center text-white"
                : failed
                  ? "border-b-2 border-ink-950 bg-red-600 px-7 py-10 text-center text-white"
                  : "border-b-2 border-ink-950 bg-night px-7 py-10 text-center text-white"
            }
          >
            <span className="relative mx-auto grid size-16 place-items-center">
              <span
                className={
                  delivered
                    ? "animate-ping-slow absolute inset-0 bg-white/30"
                    : "absolute inset-0 bg-white/20"
                }
              />
              <span className="relative grid size-16 place-items-center border-2 border-ink-950 bg-surface text-3xl">
                {delivered ? (
                  <svg viewBox="0 0 24 24" className="size-8 text-ink-950" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : failed ? (
                  <svg viewBox="0 0 24 24" className="size-8 text-ink-950" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                    <path d="M12 9v4M12 17h.01" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="size-8 text-ink-950" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" />
                  </svg>
                )}
              </span>
            </span>
            <h1 className="mt-5 font-display text-3xl font-bold">
              {delivered ? "Delivered!" : failed ? "Delivery failed" : "Payment received"}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-white/80">
              {delivered
                ? `Your ${formatLocal(entry.amountLocal, entry.currency)} ${entry.providerShort} ${
                    entry.service
                  } top-up has been delivered to ${entry.recipient}.`
                : failed
                  ? "We couldn't complete the delivery. Your payment will be reviewed — please contact support."
                  : "Your payment was received and is being processed."}
            </p>
          </div>

          {/* Body */}
          <div className="px-7 py-7">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm font-bold">
              <Detail label="Order" value={entry.id} mono />
              <Detail label="Status" value={<StatusChip status={entry.status} />} />
              <Detail label="Service" value={entry.service} capitalize />
              <Detail label="Provider" value={entry.providerName} />
              <Detail label={entry.recipientLabel} value={entry.recipient} mono />
              <Detail label="Amount" value={formatLocal(entry.amountLocal, entry.currency)} />
            </dl>

            {entry.bundle && (
              <div className="mt-5 flex items-center justify-between border-2 border-ink-950 bg-ink-50 px-4 py-3 text-sm">
                <span className="font-semibold text-ink-500">Bundle</span>
                <span className="font-bold text-ink-900">
                  {entry.bundle.size} · {entry.bundle.validity}
                </span>
              </div>
            )}

            {/* Electricity token */}
            {entry.token && (
              <div className="mt-5 border-2 border-ink-950 bg-night p-5 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-ink-500">
                  Recharge token · 20 digits
                </p>
                <p className="mt-3 font-mono text-2xl font-bold tracking-[0.15em] text-sun-300 sm:text-3xl">
                  {entry.token}
                </p>
                <div className="mt-4 flex justify-center">
                  <CopyButton token={entry.token} />
                </div>
                <p className="mt-4 text-xs leading-relaxed text-ink-400">
                  Enter this token on your meter to credit your account. Keep it safe.
                </p>
              </div>
            )}

            {entry.message && delivered && (
              <p className="mt-5 border-2 border-ink-950 bg-sun-50 px-4 py-3 text-xs leading-relaxed text-sun-800">
                <svg viewBox="0 0 24 24" className="mr-1.5 inline size-3.5 -mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                {entry.message}
              </p>
            )}

            <div className="mt-5 flex items-center justify-between border-2 border-ink-950 bg-ink-50/70 px-4 py-3 text-sm">
              <span className="font-bold text-ink-900">Paid</span>
              <span className="font-mono text-base font-extrabold text-brand-700">
                {formatUsd(entry.usdTotal)}
                <span className="ml-2 text-xs font-semibold text-ink-400">
                  {entry.paymentMethod === "circle" ? "USDC · Circle" : "USDC · wallet"}
                </span>
              </span>
            </div>

            {entry.txHash && entry.chainId && (
              <div className="mt-4 flex items-center justify-between border-2 border-ink-950 bg-ink-50 px-4 py-3 text-sm">
                <span className="font-semibold text-ink-500">On-chain receipt</span>
                <a
                  href={txExplorerLink(entry.txHash, entry.chainId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-brand-700 hover:text-brand-600 hover:underline"
                >
                  View transaction
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17 17 7M8 7h9v9" />
                  </svg>
                </a>
              </div>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/buy"
                className="btn-cta flex-1 border-2 border-ink-950 bg-night px-6 py-3.5 text-center text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-ink-800"
              >
                Buy another top-up
              </Link>
              <Link
                href="/transactions"
                className="flex-1 border-2 border-ink-950 bg-ink-50 px-6 py-3.5 text-center text-sm font-bold text-ink-950 transition-all hover:-translate-y-0.5 hover:bg-brand-50"
              >
                View transactions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
  capitalize,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold text-ink-400">{label}</dt>
      <dd className={`mt-1 text-sm font-bold text-ink-900 ${mono ? "font-mono" : ""} ${capitalize ? "capitalize" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function CopyButton({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = token;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex items-center gap-2 border-2 border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-white/20"
    >
      {copied ? (
        <>
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="12" height="12" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
          Copy token
        </>
      )}
    </button>
  );
}

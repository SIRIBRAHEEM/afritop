"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { subscribeReceipts, getReceiptsSnapshot } from "@/lib/receipt-journal";
import { ReceiptCard } from "@/components/ReceiptCard";

/**
 * Rendered by the (server) success page when the order can't be found in the
 * ephemeral server store. Reads the client receipt journal — written the
 * moment a payment was broadcast — so the receipt always displays.
 *
 * `getServerSnapshot` returns `null` so the server and the hydration render
 * both show the neutral spinner; the journal is only read once mounted.
 */
export function ReceiptFallback({ orderId }: { orderId: string }) {
  const receipts = useSyncExternalStore(subscribeReceipts, getReceiptsSnapshot, () => null);
  const receipt = receipts && orderId ? receipts.find((r) => r.id === orderId) : undefined;

  if (receipts === null) {
    return (
      <div className="grid flex-1 place-items-center bg-paper px-4 py-24">
        <svg viewBox="0 0 24 24" className="size-8 animate-spin text-brand-500" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="grid flex-1 place-items-center bg-paper px-4 py-24">
        <div className="max-w-md border-2 border-ink-950 bg-surface p-8 text-center">
          <span className="mx-auto grid size-16 place-items-center border-2 border-ink-950 bg-paper text-ink-950">
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink-900">Order not found</h1>
          <p className="mt-2 text-sm text-ink-500">
            We couldn&apos;t find that order. If you just paid, give it a few seconds and refresh — or
            check your browser&apos;s saved receipts.
          </p>
          <Link
            href="/buy"
            className="btn-cta mt-6 inline-flex border-2 border-ink-950 bg-night px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-ink-800"
          >
            Back to top-up
          </Link>
        </div>
      </div>
    );
  }

  return <ReceiptCard entry={receipt} />;
}

"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  getReceiptsSnapshot,
  orderToEntry,
  saveReceipt,
  subscribeReceipts,
} from "@/lib/receipt-journal";
import { ReceiptCard } from "@/components/ReceiptCard";

/**
 * Rendered by the (server) success page when the order can't be found in the
 * ephemeral server store. Reads the client receipt journal — written the
 * moment a payment was broadcast — so the receipt always displays.
 *
 * When the journal only has the pending entry (a QR / copy-address payment
 * auto-completed by the server-side sweep while the page was closed), we poll
 * /api/orders/[id] and fold the settled order back into the journal, so the
 * receipt appears by itself without a manual refresh.
 *
 * `getServerSnapshot` returns `null` so the server and the hydration render
 * both show the neutral spinner; the journal is only read once mounted.
 */
export function ReceiptFallback({ orderId }: { orderId: string }) {
  const receipts = useSyncExternalStore(subscribeReceipts, getReceiptsSnapshot, () => null);
  const receipt = receipts && orderId ? receipts.find((r) => r.id === orderId) : undefined;
  const settled = receipt && receipt.status !== "pending_payment";

  // Watch for the server-side sweep to finish this order, then mirror it into
  // the journal so the receipt renders automatically. Stops once settled — no
  // pointless polling while the user looks at their receipt.
  useEffect(() => {
    if (settled) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();
        if (data?.order && data.order.status !== "pending_payment") {
          saveReceipt(orderToEntry(data.order));
        }
      } catch {
        // server store may be ephemeral — keep polling
      }
    }, 3000);
    return () => clearInterval(id);
  }, [orderId, settled]);

  if (receipts === null) {
    return (
      <div className="grid flex-1 place-items-center bg-paper px-4 py-24">
        <svg viewBox="0 0 24 24" className="size-8 animate-spin text-brand-500" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
      </div>
    );
  }

  if (settled) {
    return <ReceiptCard entry={receipt} />;
  }

  return (
    <div className="grid flex-1 place-items-center bg-paper px-4 py-24">
      <div className="max-w-md border-2 border-ink-950 bg-surface p-8 text-center">
        <span className="relative mx-auto grid size-16 place-items-center">
          <span className="animate-ping-slow absolute inset-0 bg-brand-300/60" />
          <span className="relative grid size-16 place-items-center border-2 border-ink-950 bg-night text-white">
            <svg viewBox="0 0 24 24" className="size-7 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          </span>
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold text-ink-900">Finishing your order</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Your payment is being confirmed on-chain and the top-up completes
          automatically. This usually takes a few seconds. Your receipt appears
          here by itself.
        </p>
        <Link
          href="/buy"
          className="mt-6 inline-block border-2 border-ink-950 bg-surface px-6 py-3 text-sm font-bold text-ink-950 transition-colors hover:bg-ink-100"
        >
          Back to top-up
        </Link>
      </div>
    </div>
  );
}

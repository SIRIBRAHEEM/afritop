"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { subscribeReceipts, getReceiptsSnapshot, type ReceiptEntry } from "@/lib/receipt-journal";
import type { Order } from "@/lib/store";
import { PayPanel, type PayPanelOrder } from "@/components/PayPanel";

/**
 * Resolves the order shown on /pay/[orderId].
 *
 * The server store is ephemeral on serverless platforms (no Redis configured),
 * so an order created by /api/checkout may be gone by the time /pay renders on
 * a different instance. We therefore read the client receipt journal — written
 * by /buy before navigating — as a fallback, and only show "Order not found"
 * when neither source has the order.
 */

interface PayGateProps {
  orderId: string;
  serverOrder?: Order;
  demoMode: boolean;
  circleConfigured: boolean;
  cancelled: boolean;
}

function fromServerOrder(order: Order): PayPanelOrder {
  return {
    id: order.id,
    usdTotal: order.usdTotal,
    service: order.service,
    provider: order.provider.short,
    providerId: order.provider.id,
    providerName: order.provider.name,
    recipient: order.recipient,
    recipientLabel: order.recipientLabel,
    amountLocal: order.amountLocal,
    currency: order.currency,
    countryCode: order.countryCode,
    receiver: order.receiver ?? "",
  };
}

function fromJournalEntry(entry: ReceiptEntry): PayPanelOrder {
  return {
    id: entry.id,
    usdTotal: entry.usdTotal,
    service: entry.service,
    provider: entry.providerShort,
    providerId: entry.providerId,
    providerName: entry.providerName,
    recipient: entry.recipient,
    recipientLabel: entry.recipientLabel,
    amountLocal: entry.amountLocal,
    currency: entry.currency,
    countryCode: entry.countryCode,
    receiver: entry.receiver ?? "",
  };
}

function NotFoundCard() {
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
          We couldn&apos;t find that order on this device. If you just paid, your receipt
          is saved in your browser. Otherwise start a new top-up and it will be ready
          to pay right away.
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

export function PayGate({ orderId, serverOrder, demoMode, circleConfigured, cancelled }: PayGateProps) {
  const receipts = useSyncExternalStore(subscribeReceipts, getReceiptsSnapshot, () => null);
  const entry = receipts && orderId ? receipts.find((r) => r.id === orderId) : undefined;

  // Server data wins when present (authoritative); the journal covers the
  // ephemeral-store case. While the journal is still loading (first render)
  // and there's no server order, hold on a neutral spinner.
  const order = serverOrder
    ? fromServerOrder(serverOrder)
    : entry
      ? fromJournalEntry(entry)
      : undefined;

  if (!order) {
    if (receipts === null) {
      return (
        <div className="grid flex-1 place-items-center bg-paper px-4 py-24">
          <svg viewBox="0 0 24 24" className="size-8 animate-spin text-brand-500" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        </div>
      );
    }
    return <NotFoundCard />;
  }

  return (
    <PayPanel
      order={order}
      demoMode={demoMode}
      circleConfigured={circleConfigured}
      cancelled={cancelled}
    />
  );
}

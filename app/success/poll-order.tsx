"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { subscribeReceipts, getReceiptsSnapshot, type ReceiptEntry } from "@/lib/receipt-journal";
import { ReceiptCard } from "@/components/ReceiptCard";

interface RawOrder {
  id: string;
  status: string;
}

export function PollOrder({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  // Wallet payments write the receipt journal synchronously before navigating
  // here, so we can show the receipt immediately instead of polling a server
  // store that may be ephemeral on serverless platforms.
  const receipts = useSyncExternalStore(subscribeReceipts, getReceiptsSnapshot, () => null);
  const entry: ReceiptEntry | undefined =
    receipts?.find((r) => r.id === orderId) ?? undefined;
  const done = entry !== undefined && entry.status !== "pending_payment";

  useEffect(() => {
    if (done) return;
    let cancelled = false;
    const started = Date.now();
    const tick = async () => {
      if (cancelled) return;
      setElapsed(Math.round((Date.now() - started) / 1000));
      try {
        const res = await fetch("/api/transactions");
        const data = await res.json();
        const order: RawOrder | undefined = data?.orders?.find((o: RawOrder) => o.id === orderId);
        if (order && order.status !== "pending_payment") {
          router.refresh();
          return;
        }
      } catch {
        // keep polling
      }
    };
    void tick();
    const interval = setInterval(tick, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [orderId, router, done]);

  if (done && entry) {
    return <ReceiptCard entry={entry} />;
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
        <h1 className="mt-5 font-display text-2xl font-bold text-ink-900">Payment received</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Your order <span className="font-mono font-bold text-ink-700">{orderId}</span> is being
          fulfilled. We&apos;re waiting for Circle to confirm the settlement — this usually takes a
          few seconds.
        </p>
        <p className="mt-4 text-xs font-semibold text-ink-400">Checking… {elapsed}s</p>
      </div>
    </div>
  );
}

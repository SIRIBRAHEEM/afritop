import { getOrder, listOrders, updateOrder } from "@/lib/store";
import { USDC_CHAINS } from "@/lib/chains";
import { scanUsdcTransfer } from "@/lib/usdc-verify";
import { fulfillOrder } from "@/lib/fulfill";

/**
 * Server-side auto-completion for QR / copy-address payments.
 *
 * The client polls while the pay page is open, but a payment must also
 * complete when the user closes the tab entirely. `runSweep` scans the
 * receiver address for every pending order (bounded to transfers that arrived
 * after the order was created) and fulfils any that have been paid — no client
 * involvement needed. It's invoked by:
 *  - the Vercel cron job (every minute, via /api/sweep)
 *  - opportunistically from /api/scan-usdc when a specific order hasn't
 *    matched yet (real traffic triggers it even without the cron)
 *
 * Rate-limited per instance so frequent callers can't hammer the RPC.
 */

const MIN_INTERVAL_MS = 20_000;
const MAX_ORDERS_PER_RUN = 10;

let lastRun = 0;

export interface SweepResult {
  skipped: boolean;
  swept: number;
  fulfilled: string[];
}

export async function runSweep(): Promise<SweepResult> {
  const now = Date.now();
  if (now - lastRun < MIN_INTERVAL_MS) {
    return { skipped: true, swept: 0, fulfilled: [] };
  }
  lastRun = now;

  const chain = USDC_CHAINS[0]; // Arc Testnet — the only network right now
  if (!chain) return { skipped: false, swept: 0, fulfilled: [] };

  const all = await listOrders();
  // Every tx hash already claimed by any order — one transfer pays one order.
  const used = new Set(all.filter((o) => o.txHash).map((o) => o.txHash!.toLowerCase()));
  const pending = all
    .filter((o) => o.status === "pending_payment" && o.receiver)
    .slice(0, MAX_ORDERS_PER_RUN);

  const fulfilled: string[] = [];
  for (const order of pending) {
    try {
      const found = await scanUsdcTransfer({
        chain,
        to: order.receiver!,
        expectedAmountUsd: order.usdTotal.toFixed(2),
        excludeTxHashes: [...used],
        since: new Date(order.createdAt).getTime(),
      });
      if (!found) continue;

      // Re-read before fulfilling: a concurrent sweep (cron + piggyback on
      // another instance) may have claimed this transfer first. Skipping here
      // prevents double delivery (e.g. two airtime credits for one payment).
      const current = await getOrder(order.id);
      if (!current || current.status !== "pending_payment") continue;

      used.add(found.txHash.toLowerCase());
      await updateOrder(order.id, {
        txHash: found.txHash,
        chainId: chain.chain.id,
        wallet: found.from.toLowerCase(), // cloud history key for the payer
      });
      const fresh = await fulfillOrder(order.id);
      if (fresh.status === "delivered" || fresh.status === "paid") {
        fulfilled.push(order.id);
      }
    } catch (err) {
      console.error(`[sweep] order ${order.id} failed`, err);
    }
  }

  return { skipped: false, swept: pending.length, fulfilled };
}

/** True when the order has reached a terminal, fulfilled state. */
export async function orderIsSettled(orderId: string): Promise<boolean> {
  const order = await getOrder(orderId);
  return Boolean(order && (order.status === "delivered" || order.status === "paid"));
}

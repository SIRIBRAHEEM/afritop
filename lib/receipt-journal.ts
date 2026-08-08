import type { Order } from "@/lib/store";

/**
 * Client-side receipt journal.
 *
 * The server persists orders to a local JSON file (or /tmp on serverless
 * platforms like Vercel / Netlify), which is ephemeral — a fresh instance or
 * cold start can lose it, leaving the success page on "Order not found" and the
 * transaction history empty. We therefore mirror every payment into
 * localStorage the moment it's broadcast, so receipts and history always
 * render instantly on the same device, no matter what the server store has.
 *
 * React integration: expose a stable snapshot via useSyncExternalStore so
 * components re-render when the journal changes without any setState-in-effect.
 */

export interface ReceiptEntry {
  id: string;
  createdAt: string;
  status: "pending_payment" | "paid" | "delivered" | "failed" | "cancelled";
  service: string;
  countryCode: string;
  providerId: string;
  providerShort: string;
  providerName: string;
  recipientLabel: string;
  recipient: string;
  amountLocal: number;
  currency: string;
  usdTotal: number;
  bundle?: { size: string; validity: string };
  receiver?: string; // USDC payment destination (QR / copy-address flow)
  usdSubtotal?: number;
  fee?: number;
  txHash?: string;
  chainId?: number;
  token?: string;
  message?: string;
  paymentMethod?: "wallet" | "circle" | "mock";
}

const KEY = "afritop:receipts";
const MAX = 50;

let snapshot: ReceiptEntry[] | null = null;
const listeners = new Set<() => void>();

function read(): ReceiptEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as ReceiptEntry[]) : [];
  } catch {
    return [];
  }
}

function emit(): void {
  snapshot = null; // invalidate cache so the next getSnapshot re-reads
  listeners.forEach((cb) => cb());
}

function write(entries: ReceiptEntry[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
  } catch {
    // storage unavailable (private mode / quota) — the receipt is best-effort
  }
  emit();
}

/**
 * React external-store snapshot. Returns the same array reference while the
 * journal is unchanged, so `useSyncExternalStore` won't loop. Never `null` on
 * the client; `null` is reserved for the server snapshot ("not loaded yet").
 */
export function getReceiptsSnapshot(): ReceiptEntry[] | null {
  if (snapshot === null) snapshot = read();
  return snapshot;
}

/** Subscribe to journal changes (same-tab writes + cross-tab `storage` events). */
export function subscribeReceipts(cb: () => void): () => void {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) emit();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

/** Save (or replace) a receipt — newest first, capped. */
export function saveReceipt(entry: ReceiptEntry): void {
  const entries = read().filter((e) => e.id !== entry.id);
  entries.unshift(entry);
  write(entries);
}

/** Merge a partial update into an existing receipt (e.g. paid → delivered). */
export function updateReceipt(id: string, patch: Partial<ReceiptEntry>): void {
  const entries = read();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return;
  entries[idx] = { ...entries[idx], ...patch };
  write(entries);
}

/** Map a server Order into the receipt shape so one component renders both. */
export function orderToEntry(order: Order): ReceiptEntry {
  return {
    id: order.id,
    createdAt: order.createdAt,
    status: order.status,
    service: order.service,
    countryCode: order.countryCode,
    providerId: order.provider.id,
    providerShort: order.provider.short,
    providerName: order.provider.name,
    recipientLabel: order.recipientLabel,
    recipient: order.recipient,
    amountLocal: order.amountLocal,
    currency: order.currency,
    usdTotal: order.usdTotal,
    bundle: order.bundle,
    receiver: order.receiver,
    usdSubtotal: order.usdSubtotal,
    fee: order.fee,
    txHash: order.txHash,
    chainId: order.chainId,
    token: order.token,
    message: order.message,
    paymentMethod: order.paymentMethod,
  };
}

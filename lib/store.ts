import { promises as fs } from "fs";
import path from "path";
import type { ServiceId } from "@/lib/catalog";

export type OrderStatus = "pending_payment" | "paid" | "delivered" | "failed" | "cancelled";

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  service: ServiceId;
  countryCode: string;
  provider: { id: string; name: string; short: string };
  recipientLabel: string; // "Phone" | "Meter no."
  recipient: string;
  amountLocal: number;
  currency: string;
  usdSubtotal: number;
  fee: number;
  usdTotal: number;
  bundle?: { size: string; validity: string };
  token?: string; // electricity recharge token
  providerRef?: string; // reference returned by the vendor
  paymentMethod: "wallet" | "circle" | "mock";
  receiver?: string; // USDC wallet receiver address (wallet payments)
  txHash?: string; // on-chain transaction hash (wallet payments)
  chainId?: number; // network the USDC payment was made on
  message?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(ORDERS_FILE);
  } catch {
    await fs.writeFile(ORDERS_FILE, "[]", "utf8");
  }
}

async function readOrders(): Promise<Order[]> {
  await ensureFile();
  const raw = await fs.readFile(ORDERS_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeOrders(orders: Order[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
}

/**
 * Simple in-process mutex so concurrent requests (two checkouts, or the webhook
 * plus a purchase) can't clobber each other's read-modify-write cycles.
 * (For a single instance this is sufficient; for multi-instance deployments
 * replace the file store with a real database.)
 */
let lock: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function addOrder(order: Order): Promise<Order> {
  return withLock(async () => {
    const orders = await readOrders();
    orders.unshift(order);
    await writeOrders(orders);
    return order;
  });
}

export function getOrder(id: string): Promise<Order | undefined> {
  return withLock(async () => {
    const orders = await readOrders();
    return orders.find((o) => o.id === id);
  });
}

export function updateOrder(id: string, patch: Partial<Order>): Promise<Order | undefined> {
  return withLock(async () => {
    const orders = await readOrders();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return undefined;
    orders[idx] = { ...orders[idx], ...patch };
    await writeOrders(orders);
    return orders[idx];
  });
}

export function listOrders(): Promise<Order[]> {
  return withLock(async () => readOrders());
}

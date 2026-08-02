import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { Redis } from "@upstash/redis";
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
  wallet?: string; // payer's wallet address (lowercased) — enables cloud history per wallet
  message?: string;
}

/* ── Storage backends ──────────────────────────────────────────
 *
 * Primary: Upstash Redis (durable, serverless — set UPSTASH_REDIS_REST_URL
 * and UPSTASH_REDIS_REST_TOKEN). This is what makes "login with your wallet"
 * history actually persist in the cloud across devices and cold starts.
 *
 * Fallback: a local JSON file (or /tmp on Vercel/Netlify, or in-memory).
 * Ephemeral on serverless platforms — only used when Redis isn't configured.
 * ─────────────────────────────────────────────────────────────── */

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const orderKey = (id: string) => `order:${id}`;
const walletKey = (address: string) => `wallet:${address.toLowerCase()}:ids`;
const ALL_ORDERS_KEY = "orders:all";

/* ── Redis backend (atomic per-key ops — no read-modify-write races) ── */

async function redisAddOrder(order: Order): Promise<Order> {
  const pipeline = redis!.pipeline();
  pipeline.set(orderKey(order.id), order);
  pipeline.rpush(ALL_ORDERS_KEY, order.id);
  await pipeline.exec();
  return order;
}

async function redisGetOrder(id: string): Promise<Order | undefined> {
  const raw = await redis!.get<string>(orderKey(id));
  return raw ? (JSON.parse(raw) as Order) : undefined;
}

async function redisUpdateOrder(id: string, patch: Partial<Order>): Promise<Order | undefined> {
  const order = await redisGetOrder(id);
  if (!order) return undefined;
  const updated = { ...order, ...patch };
  await redis!.set(orderKey(id), updated);
  if (patch.wallet) {
    // Index under the payer's wallet so /api/transactions can list it.
    await redis!.sadd(walletKey(patch.wallet), id);
  }
  return updated;
}

async function redisListOrders(): Promise<Order[]> {
  const ids = await redis!.lrange(ALL_ORDERS_KEY, 0, -1);
  if (!ids.length) return [];
  const pipeline = redis!.pipeline();
  for (const id of ids) pipeline.get<string>(orderKey(id));
  const raws = await pipeline.exec<string[]>();
  return raws
    .filter((r): r is string => Boolean(r))
    .map((r) => JSON.parse(r) as Order);
}

/** Orders paid for by a given wallet address (the "cloud history" source). */
export async function listOrdersByWallet(address: string): Promise<Order[]> {
  if (!address) return [];
  if (redis) {
    const ids = await redis!.smembers(walletKey(address));
    if (!ids.length) return [];
    const pipeline = redis!.pipeline();
    for (const id of ids) pipeline.get<string>(orderKey(id));
    const raws = await pipeline.exec<string[]>();
    return raws
      .filter((r): r is string => Boolean(r))
      .map((r) => JSON.parse(r) as Order)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  // Fallback (file store): filter in-process by wallet.
  const all = await listOrders();
  const lower = address.toLowerCase();
  return all
    .filter((o) => o.wallet?.toLowerCase() === lower)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ── File backend (fallback) ─────────────────────────────────── */

const DATA_DIR =
  process.env.VERCEL || process.env.NETLIFY
    ? path.join(os.tmpdir(), "afritop-data")
    : path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

let memoryStore: Order[] | null = null;

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(ORDERS_FILE);
  } catch {
    await fs.writeFile(ORDERS_FILE, "[]", "utf8");
  }
}

async function readOrders(): Promise<Order[]> {
  if (memoryStore) return memoryStore;
  try {
    await ensureFile();
    const raw = await fs.readFile(ORDERS_FILE, "utf8");
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  } catch (err) {
    console.warn("[store] filesystem unavailable — using in-memory store", err);
    memoryStore = [];
    return memoryStore;
  }
}

async function writeOrders(orders: Order[]): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf8");
  } catch (err) {
    console.warn("[store] filesystem unavailable — keeping orders in memory", err);
    memoryStore = orders;
  }
}

/** In-process mutex so concurrent file-store requests can't clobber each other. */
let lock: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/* ── Public API (auto-routes to Redis when configured) ───────── */

export function addOrder(order: Order): Promise<Order> {
  if (redis) return redisAddOrder(order);
  return withLock(async () => {
    const orders = await readOrders();
    orders.unshift(order);
    await writeOrders(orders);
    return order;
  });
}

export function getOrder(id: string): Promise<Order | undefined> {
  if (redis) return redisGetOrder(id);
  return withLock(async () => {
    const orders = await readOrders();
    return orders.find((o) => o.id === id);
  });
}

export function updateOrder(id: string, patch: Partial<Order>): Promise<Order | undefined> {
  if (redis) return redisUpdateOrder(id, patch);
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
  if (redis) return redisListOrders();
  return withLock(async () => readOrders());
}

import { Redis } from "@upstash/redis";

/**
 * Support-chat thread store.
 *
 * Each chat conversation is keyed by a client-generated id (localStorage), so
 * the thread survives refreshes and — when Redis is configured — is shared
 * across server instances. Owner replies arrive via the /api/support/inbound
 * webhook and are appended here; the chat widget polls /api/support/inbox.
 *
 * Primary: Upstash Redis (set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN).
 * Fallback: in-memory Map (per server instance — fine for dev, ephemeral in prod).
 */

export interface SupportMessage {
  id: string;
  role: "customer" | "owner";
  text: string;
  at: string;
}

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const threadKey = (convId: string) => `support:thread:${convId}`;

const memory = new Map<string, SupportMessage[]>();

export async function appendMessage(convId: string, msg: SupportMessage): Promise<void> {
  if (redis) {
    await redis.rpush(threadKey(convId), JSON.stringify(msg));
    return;
  }
  const list = memory.get(threadKey(convId)) ?? [];
  list.push(msg);
  memory.set(threadKey(convId), list);
}

export async function getThread(convId: string): Promise<SupportMessage[]> {
  if (redis) {
    const raws = await redis.lrange<string>(threadKey(convId), 0, -1);
    return raws
      .filter((r): r is string => Boolean(r))
      .map((r) => JSON.parse(r) as SupportMessage);
  }
  return memory.get(threadKey(convId)) ?? [];
}

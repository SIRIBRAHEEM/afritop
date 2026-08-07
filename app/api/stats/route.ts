import { NextResponse } from "next/server";
import { listOrders } from "@/lib/store";

export const runtime = "nodejs";
// The homepage chart polls this endpoint — never cache, always fresh.
export const dynamic = "force-dynamic";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/**
 * GET /api/stats — public aggregate of REAL on-site deliveries, served to the
 * homepage "Deliveries this week" live chart.
 *
 * Counts orders that were actually fulfilled (status "delivered"), bucketed by
 * UTC day across the last 7 rolling days (oldest → newest, today last). Also
 * returns how many landed in the last hour (the "+N live" badge) and the
 * all-time total. Reads are cheap Upstash Redis HTTP calls — safe on serverless.
 */
export async function GET() {
  const orders = await listOrders();

  const now = Date.now();
  const startOfToday = new Date(now);
  startOfToday.setUTCHours(0, 0, 0, 0);
  const startOfTodayMs = startOfToday.getTime();

  const buckets = new Array(7).fill(0) as number[];
  let allTime = 0;
  let live = 0;

  for (const order of orders) {
    if (order.status !== "delivered") continue;
    const t = Date.parse(order.createdAt);
    if (!Number.isFinite(t)) continue;
    allTime++;
    if (t <= now && now - t < HOUR_MS) live++;
    // Orders created today but before this moment sit slightly *past* the
    // UTC-midnight boundary, so clamp the floor (e.g. -1) up to today.
    const daysAgo = Math.max(0, Math.floor((startOfTodayMs - t) / DAY_MS));
    if (daysAgo <= 6) buckets[6 - daysAgo]++;
  }

  const labels = buckets.map((_, i) => {
    const d = new Date(startOfTodayMs - (6 - i) * DAY_MS);
    return DAY_NAMES[d.getUTCDay()];
  });

  const weekTotal = buckets.reduce((a, b) => a + b, 0);

  return NextResponse.json(
    { weekTotal, buckets, labels, live, allTime, updatedAt: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    },
  );
}

import { NextResponse } from "next/server";
import { runSweep } from "@/lib/sweep";

export const runtime = "nodejs";
// Sweeping a few pending orders involves a couple of RPC round-trips each;
// give it room on serverless before the default timeout.
export const maxDuration = 60;

/**
 * GET/POST /api/sweep
 *
 * Auto-completes QR / copy-address payments server-side: scans the receiver
 * address for every pending order and fulfils any that have been paid. Called
 * every minute by the Vercel cron (vercel.json) and opportunistically from
 * /api/scan-usdc. Rate-limited inside `runSweep`, so concurrent calls are
 * cheap no-ops.
 */
export async function GET() {
  return handleSweep();
}

export async function POST() {
  return handleSweep();
}

async function handleSweep() {
  try {
    const result = await runSweep();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[sweep] error", err);
    return NextResponse.json({ error: "Sweep failed." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getPublicRates } from "@/lib/fx-rates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/fx-rates
 *
 * The live USD → local-currency rates for the four AfriTop markets — the same
 * numbers `/api/checkout` charges at, so the ticker and the order total can't
 * disagree.
 *
 * Returns 503 when no trustworthy rate is available (the upstream feed is down
 * and our cache has gone stale). Callers should surface "unavailable" rather
 * than falling back to a fabricated rate.
 */
export async function GET() {
  const quote = await getPublicRates();
  if (!quote) {
    return NextResponse.json(
      { error: "Live exchange rates are unavailable right now." },
      { status: 503 },
    );
  }
  return NextResponse.json(quote);
}

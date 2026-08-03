import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/fx-rates
 *
 * Returns live USD → local-currency exchange rates for the four AfriTop
 * markets.  Uses the free Frankfurter API (no key required) and falls back
 * to the static rates on network failure.
 */
const FALLBACK: Record<string, number> = {
  NGN: 1480,
  GHS: 15.2,
  KES: 128,
  ZAR: 17.6,
};

export async function GET() {
  try {
    // Frankfurter: https://www.frankfurter.app — free, no key, unlimited.
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=NGN,GHS,KES,ZAR",
      { next: { revalidate: 300 } }, // 5-minute cache on the server
    );

    if (!res.ok) {
      console.warn("[fx-rates] Frankfurter returned", res.status);
      return NextResponse.json({ rates: FALLBACK, source: "fallback" });
    }

    const data: { rates: Record<string, number>; date: string } =
      await res.json();

    const rates: Record<string, number> = {
      NGN: data.rates.NGN ?? FALLBACK.NGN,
      GHS: data.rates.GHS ?? FALLBACK.GHS,
      KES: data.rates.KES ?? FALLBACK.KES,
      ZAR: data.rates.ZAR ?? FALLBACK.ZAR,
    };

    return NextResponse.json({ rates, source: "live", date: data.date });
  } catch (err) {
    console.warn("[fx-rates] fetch failed, using fallback", err);
    return NextResponse.json({ rates: FALLBACK, source: "fallback" });
  }
}
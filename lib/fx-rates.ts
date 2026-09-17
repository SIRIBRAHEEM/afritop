import { QUOTE_CURRENCIES } from "@/lib/fx";

/**
 * Live USD → local-currency rates.
 *
 * One source of truth for both the marketing rate ticker and the checkout, so
 * the number a customer sees is the number they're charged. Free
 * open.er-api.com, no key required.
 *
 * This module deliberately FAILS CLOSED. During the testnet phase a stale
 * hardcoded rate was harmless because no real money moved; on mainnet, pricing
 * real top-ups off a stale naira rate quietly sells at a loss. So we serve a
 * short-lived cache of live rates and, past that, refuse to quote at all rather
 * than fall back to a number nobody verified.
 */

export interface FxRates {
  rates: Record<string, number>;
  /** "live" = just fetched. "cached" = a recent successful fetch we're reusing. */
  source: "live" | "cached";
  date?: string;
  fetchedAt: number;
}

/** ExchangeRate-API — free, supports NGN/GHS/KES/ZAR, no key required. */
const FX_API_URL = "https://open.er-api.com/v6/latest/USD";

/** Serve a fresh-enough rate without re-fetching on every request. */
const CACHE_TTL_MS = 5 * 60 * 1000;
/** Past this, cached rates are too old to price real orders against. */
const MAX_STALE_MS = 30 * 60 * 1000;

let cache: FxRates | null = null;
let inFlight: Promise<FxRates | null> | null = null;

async function fetchLive(): Promise<FxRates | null> {
  try {
    const res = await fetch(FX_API_URL, { cache: "no-store" });
    if (!res.ok) {
      console.warn("[fx-rates] exchange-rate API returned", res.status);
      return null;
    }
    const data = (await res.json()) as { rates?: Record<string, number>; date?: string; time_last_update_utc?: string };

    const rates: Record<string, number> = {};
    for (const code of QUOTE_CURRENCIES) {
      const value = data.rates?.[code];
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        rates[code] = value;
      }
    }
    // A partial response is not something we can price a basket of countries
    // against honestly — treat it as a failure.
    if (Object.keys(rates).length !== QUOTE_CURRENCIES.length) {
      console.warn("[fx-rates] incomplete rate set", Object.keys(rates));
      return null;
    }

    return { rates, source: "live", date: data.date, fetchedAt: Date.now() };
  } catch (err) {
    console.warn("[fx-rates] fetch failed", err);
    return null;
  }
}

/**
 * Fresh rates, or `null` when we can't source a rate we trust. Callers must
 * refuse to quote on `null`.
 */
export async function getFxRates(): Promise<FxRates | null> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < CACHE_TTL_MS) return cache;

  if (!inFlight) {
    inFlight = fetchLive().finally(() => {
      inFlight = null;
    });
  }
  const fresh = await inFlight;

  if (fresh) {
    cache = fresh;
    return fresh;
  }

  if (cache && now - cache.fetchedAt < MAX_STALE_MS) {
    return { ...cache, source: "cached" };
  }

  return null;
}

/** The rates the public ticker displays — identical to the ones we charge at. */
export async function getPublicRates(): Promise<{
  rates: Record<string, number>;
  source: FxRates["source"];
  date?: string;
} | null> {
  const quote = await getFxRates();
  if (!quote) return null;
  return { rates: quote.rates, source: quote.source, date: quote.date };
}

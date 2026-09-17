import { round2 } from "@/lib/utils";

export { round2 };

/**
 * Customer-facing FX spread.
 *
 * We sell local-currency value (airtime, data, prepaid tokens) and charge in
 * USD, so the mid-market rate is a *cost*, not a price. Quoting at mid-market
 * means every sale has to convert USD back into local currency at a loss, so we
 * price a spread on top. This also absorbs a rate move between the moment a
 * customer sees a quote and the moment the order settles.
 */
export const FX_SPREAD = 0.02;

/** Currencies we quote and charge in. */
export const QUOTE_CURRENCIES = ["NGN", "GHS", "KES", "ZAR"] as const;
export type QuoteCurrency = (typeof QUOTE_CURRENCIES)[number];

/**
 * Mid-market rate (local units per USD) → the rate we actually charge at.
 *
 * A *higher* local-per-USD rate means *fewer* USD per unit of face value, which
 * is the direction that puts the margin on our side.
 */
export function effectiveRate(midMarket: number): number {
  return midMarket / (1 + FX_SPREAD);
}

/** Platform fee: 1.5% of the USD subtotal, minimum $0.05. */
export function platformFee(usdSubtotal: number): number {
  return round2(Math.max(0.05, usdSubtotal * 0.015));
}

/**
 * Local face value → USD, at the live rate plus our spread.
 *
 * Returns `null` when we have no usable rate for that currency. Callers must
 * treat that as "refuse to quote" rather than substituting a default — pricing
 * real money off an invented rate is how you sell at a loss without noticing.
 */
export function toUsd(
  local: number,
  currency: string,
  rates: Record<string, number>,
): number | null {
  const mid = rates[currency];
  if (!Number.isFinite(mid) || mid <= 0) return null;
  if (!Number.isFinite(local)) return null;
  return round2(local / effectiveRate(mid));
}

export function formatLocal(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "NGN" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

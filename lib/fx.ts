import { round2 } from "@/lib/utils";

export { round2 };

/**
 * Indicative local-currency → USD exchange rates.
 *
 * NOTE: These are illustrative placeholders so the demo works offline.
 * Before going live, replace with a live FX feed (e.g. an exchange-rate
 * API) or the pricing API of your payout provider.
 */
export const FX_RATES: Record<string, number> = {
  NGN: 1480, // naira per USD
  GHS: 15.2, // cedi per USD
  KES: 128, // shilling per USD
  ZAR: 17.6, // rand per USD
};

/** Platform fee: 1.5% of the USD subtotal, minimum $0.05. */
export function platformFee(usdSubtotal: number): number {
  return round2(Math.max(0.05, usdSubtotal * 0.015));
}

export function toUsd(local: number, currency: string): number {
  const rate = FX_RATES[currency] ?? 1;
  return round2(local / rate);
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

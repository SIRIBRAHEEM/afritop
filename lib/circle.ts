/**
 * Circle — USDC Checkout client.
 *
 * Sandbox:   https://api-sandbox.circle.com/v1
 * Production: https://api.circle.com/v1
 *
 * We create hosted checkout sessions that the buyer is redirected to,
 * where they can pay in USDC. See https://developers.circle.com for full docs.
 */

interface CheckoutSessionInput {
  amountUsd: number;
  orderId: string;
  successUrl: string;
  cancelUrl: string;
}

export function isCircleConfigured(): boolean {
  return Boolean(process.env.CIRCLE_API_KEY);
}

/** Returns the hosted checkout URL, or null when Circle is not configured. */
export async function createCheckoutSession(input: CheckoutSessionInput): Promise<string | null> {
  if (!isCircleConfigured()) return null;

  // Testnet-only phase: Arc mainnet isn't live yet, so the hosted checkout
  // must run against the sandbox (testnet) API — buyers pay with testnet USDC
  // on Arc Testnet. Flip to https://api.circle.com/v1 only once Arc mainnet ships.
  const base = "https://api-sandbox.circle.com/v1";

  const res = await fetch(`${base}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CIRCLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: {
        amount: input.amountUsd.toFixed(2),
        currency: "USD",
      },
      settlementCurrency: "USD",
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      metadata: { orderId: input.orderId },
    }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[circle] checkout session failed", res.status, data);
    return null;
  }

  return data?.data?.checkoutUrl ?? null;
}

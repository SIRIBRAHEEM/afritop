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

/**
 * Circle API base URL. Mirrors the `AT_ENV` convention: `CIRCLE_ENV=live`
 * targets production, and anything else (including unset) stays on sandbox.
 *
 * Defaulting to sandbox is deliberate. Circle hosted checkout is not part of
 * the Arc mainnet launch, so an unconfigured or half-configured deployment must
 * never reach Circle's production API by accident. Flipping it live requires an
 * explicit, intentional `CIRCLE_ENV=live`.
 */
function circleBaseUrl(): string {
  return process.env.CIRCLE_ENV === "live"
    ? "https://api.circle.com/v1"
    : "https://api-sandbox.circle.com/v1";
}

/** Returns the hosted checkout URL, or null when Circle is not configured. */
export async function createCheckoutSession(input: CheckoutSessionInput): Promise<string | null> {
  if (!isCircleConfigured()) return null;

  // DEFERRED: Circle hosted checkout is not part of the Arc mainnet launch. The
  // wallet path is the single supported payment route, so this integration
  // stays dormant by defaulting to the sandbox base until `CIRCLE_ENV=live`
  // is set on purpose.
  const base = circleBaseUrl();

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

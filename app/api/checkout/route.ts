import { NextResponse } from "next/server";
import { SERVICES, getCountry, getProvider, findBundle } from "@/lib/catalog";
import { toUsd, platformFee, round2 } from "@/lib/fx";
import { addOrder, getOrder, updateOrder } from "@/lib/store";
import { createCheckoutSession, isCircleConfigured } from "@/lib/circle";
import { paymentReceiver, receiverIsDemo } from "@/lib/chains";
import { uid, normalizePhone, isValidPhone, isValidMeter } from "@/lib/utils";

export const runtime = "nodejs";

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

/**
 * Derive the public origin from the incoming request so redirect URLs work on
 * any host (Vercel, a custom domain, localhost…) without env configuration.
 */
function requestOrigin(request: Request): string {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * POST /api/checkout
 * Body: {
 *   service, countryCode, providerId, recipient, amount?, bundleId?,
 *   paymentMethod?: "wallet" | "circle"   (default: wallet)
 *   orderId?: string                       (reuse a pending order — e.g. switching to Circle)
 * }
 *
 * Returns a destination URL:
 *  - "wallet" → /pay/[orderId] (EVm wallet USDC payment page)
 *  - "circle" → Circle hosted checkout (when configured)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { service, countryCode, providerId, recipient, amount, bundleId } = body;
    const paymentMethod: "wallet" | "circle" = body.paymentMethod === "circle" ? "circle" : "wallet";
    const origin = requestOrigin(request);

    // Reuse an existing pending order when asked (e.g. switching payment method).
    if (body.orderId) {
      const existing = await getOrder(body.orderId);
      if (existing && existing.status === "pending_payment") {
        if (paymentMethod === "circle") {
          if (!isCircleConfigured()) {
            return json(400, { error: "Circle checkout isn't configured on this server." });
          }
          const checkoutUrl = await createCheckoutSession({
            amountUsd: existing.usdTotal,
            orderId: existing.id,
            successUrl: `${origin}/success?orderId=${existing.id}`,
            cancelUrl: `${origin}/pay/${existing.id}?cancelled=1`,
          });
          if (!checkoutUrl) {
            return json(502, { error: "The payment provider is unavailable. Please try again shortly." });
          }
          await updateOrder(existing.id, { paymentMethod: "circle" });
          return json(200, { mode: "circle", checkoutUrl, orderId: existing.id });
        }
        return json(200, { mode: "wallet", checkoutUrl: `/pay/${existing.id}`, orderId: existing.id });
      }
    }

    const country = getCountry(countryCode);
    if (!country) return json(400, { error: "That country isn't supported yet." });
    if (!SERVICES.some((s) => s.id === service)) {
      return json(400, { error: "Unknown service." });
    }

    let provider;
    let recipientLabel: string;
    let recipientFormatted = "";
    let amountLocal: number;
    let bundle;

    if (service === "airtime" || service === "data") {
      provider = getProvider(country, "networks", providerId);
      if (!provider) return json(400, { error: "Unknown mobile network." });
      recipientLabel = "Phone";
      if (!isValidPhone(country.phonePrefix, recipient ?? "", country.phoneDigits)) {
        return json(400, { error: "Enter a valid phone number." });
      }
      if (service === "airtime") {
        amountLocal = Number(amount);
        if (!Number.isFinite(amountLocal) || amountLocal < country.minAirtime || amountLocal > country.maxAirtime) {
          return json(400, {
            error: `Amount must be between ${country.currencySymbol}${country.minAirtime} and ${country.currencySymbol}${country.maxAirtime}.`,
          });
        }
      } else {
        bundle = findBundle(country, providerId, bundleId);
        if (!bundle) return json(400, { error: "Unknown data bundle." });
        amountLocal = bundle.price;
      }
    } else {
      // electricity
      provider = getProvider(country, "distributors", providerId);
      if (!provider) return json(400, { error: "Unknown electricity provider." });
      recipientLabel = "Meter no.";
      if (!isValidMeter(recipient ?? "")) {
        return json(400, { error: "Enter a valid meter number." });
      }
      amountLocal = Number(amount);
      if (!Number.isFinite(amountLocal) || amountLocal < country.minElectricity || amountLocal > country.maxElectricity) {
        return json(400, {
          error: `Amount must be between ${country.currencySymbol}${country.minElectricity} and ${country.currencySymbol}${country.maxElectricity}.`,
        });
      }
    }

    recipientFormatted = normalizePhone(country.phonePrefix, recipient);

    const usdSubtotal = toUsd(amountLocal, country.currency);
    const fee = platformFee(usdSubtotal);
    const usdTotal = round2(usdSubtotal + fee);

    const orderId = uid("AT");

    await addOrder({
      id: orderId,
      createdAt: new Date().toISOString(),
      status: "pending_payment",
      service,
      countryCode: country.code,
      provider: { id: provider.id, name: provider.name, short: provider.short },
      recipientLabel,
      recipient: recipientFormatted,
      amountLocal,
      currency: country.currency,
      usdSubtotal,
      fee,
      usdTotal,
      bundle: bundle ? { size: bundle.size, validity: bundle.validity } : undefined,
      paymentMethod: "wallet",
      receiver: paymentReceiver(),
    });

    // Wallet payments (the default) go to the /pay/[orderId] page.
    if (paymentMethod === "wallet") {
      return json(200, {
        mode: "wallet",
        checkoutUrl: `/pay/${orderId}`,
        orderId,
        receiver: paymentReceiver(),
        demo: receiverIsDemo(),
      });
    }

    // Circle hosted checkout — only offered when actually configured.
    if (!isCircleConfigured()) {
      return json(400, { error: "Circle checkout isn't configured on this server." });
    }
    const checkoutUrl = await createCheckoutSession({
      amountUsd: usdTotal,
      orderId,
      successUrl: `${origin}/success?orderId=${orderId}`,
      cancelUrl: `${origin}/buy?cancelled=1`,
    });
    if (!checkoutUrl) {
      return json(502, { error: "The payment provider is unavailable. Please try again shortly." });
    }
    await updateOrder(orderId, { paymentMethod: "circle" });
    return json(200, { mode: "circle", checkoutUrl, orderId });
  } catch (err) {
    console.error("[checkout] error", err);
    return json(500, { error: "Something went wrong. Please try again." });
  }
}

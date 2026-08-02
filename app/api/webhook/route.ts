import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { fulfillOrder } from "@/lib/fulfill";

export const runtime = "nodejs";

function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * POST /api/webhook — Circle webhook handler.
 * Listens for checkout.session.completed and fulfils the linked order.
 * For local testing, expose this via a tunnel (e.g. ngrok) and register it
 * in the Circle developer console.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-circle-signature");
  const secret = process.env.CIRCLE_WEBHOOK_SECRET;

  // Never process webhook events without a configured secret — otherwise anyone
  // could POST a fake "checkout.session.completed" and trigger free fulfillment.
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret not configured. Set CIRCLE_WEBHOOK_SECRET." },
      { status: 503 },
    );
  }
  if (!verifySignature(raw, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  try {
    const event = JSON.parse(raw);
    if (event?.type === "checkout.session.completed") {
      // Circle nests metadata in different places depending on event version — check both.
      const orderId =
        event?.data?.metadata?.orderId ?? event?.data?.checkoutSession?.metadata?.orderId;
      if (orderId) {
        await fulfillOrder(orderId).catch((err) => {
          console.error("[webhook] fulfill failed", orderId, err);
        });
      }
    }
  } catch (err) {
    console.error("[webhook] parse error", err);
  }

  return NextResponse.json({ received: true });
}

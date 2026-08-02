import { NextResponse } from "next/server";
import { fulfillOrder } from "@/lib/fulfill";

export const runtime = "nodejs";

/**
 * POST /api/purchase
 * Body: { orderId }
 * Marks the order as paid and executes delivery. Used by the simulated
 * payment screen (and by the webhook for real Circle payments).
 */
export async function POST(request: Request) {
  // In live-payment mode, fulfillment must only ever come from the verified
  // Circle webhook — never from a client calling this endpoint directly.
  if (process.env.CIRCLE_ENV === "live") {
    return NextResponse.json(
      { error: "Fulfillment is handled by the payment webhook in live mode." },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    if (!body?.orderId) {
      return NextResponse.json({ error: "Missing orderId." }, { status: 400 });
    }
    const order = await fulfillOrder(body.orderId);
    return NextResponse.json({ ok: true, order });
  } catch (err) {
    console.error("[purchase] error", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Purchase failed." },
      { status: 400 },
    );
  }
}

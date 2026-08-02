import { NextResponse } from "next/server";
import { getOrder, listOrders, updateOrder } from "@/lib/store";
import { getUsdcChain, receiverIsDemo } from "@/lib/chains";
import { verifyUsdcPayment } from "@/lib/usdc-verify";
import { fulfillOrder } from "@/lib/fulfill";

export const runtime = "nodejs";

/**
 * POST /api/confirm-usdc
 * Body: { orderId, txHash, chainId, sender }
 *
 * Verifies the USDC transfer on-chain against the order's receiver + total,
 * then fulfils the order (sends airtime / generates tokens).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, txHash, chainId, sender } = body;

    if (!orderId || !txHash || !chainId) {
      return NextResponse.json(
        { error: "Missing orderId, txHash or chainId." },
        { status: 400 },
      );
    }

    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.status === "delivered" || order.status === "paid") {
      return NextResponse.json({ ok: true, order });
    }
    if (order.status !== "pending_payment") {
      return NextResponse.json({ error: "This order can't be paid anymore." }, { status: 400 });
    }
    if (!order.receiver) {
      return NextResponse.json({ error: "Order has no payment destination." }, { status: 400 });
    }

    const chain = getUsdcChain(Number(chainId));
    if (!chain) {
      return NextResponse.json({ error: "Unsupported payment network." }, { status: 400 });
    }

    // Safety: never accept real (mainnet) USDC while the receiver is still the
    // demo burn address — the money would be permanently lost.
    if (receiverIsDemo() && !chain.testnet) {
      return NextResponse.json(
        { error: "Mainnet payments are disabled in demo mode. Set USDC_RECEIVER to enable them." },
        { status: 403 },
      );
    }

    // Replay guard: one on-chain transaction may only pay for one order.
    const orders = await listOrders();
    const alreadyUsed = orders.some((o) => o.id !== orderId && o.txHash === txHash);
    if (alreadyUsed) {
      return NextResponse.json(
        { error: "This transaction has already been used for another order." },
        { status: 422 },
      );
    }

    const result = await verifyUsdcPayment({
      chain,
      txHash,
      expectedTo: order.receiver,
      expectedAmountUsd: order.usdTotal.toFixed(2),
      sender,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.reason }, { status: 422 });
    }

    // Record the on-chain proof, then mark paid + deliver.
    await updateOrder(orderId, { txHash, chainId: chain.chain.id });
    const fresh = await fulfillOrder(orderId);
    return NextResponse.json({ ok: true, order: fresh });
  } catch (err) {
    console.error("[confirm-usdc] error", err);
    return NextResponse.json(
      { error: "Something went wrong while confirming the payment." },
      { status: 500 },
    );
  }
}

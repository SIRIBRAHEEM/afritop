import { NextResponse } from "next/server";
import { getOrder, listOrders, updateOrder } from "@/lib/store";
import { getUsdcChain, receiverIsDemo } from "@/lib/chains";
import { scanUsdcTransfer, verifyUsdcPayment } from "@/lib/usdc-verify";
import { fulfillOrder } from "@/lib/fulfill";
import { recreateOrderFromClient } from "@/lib/order-recovery";
import { runSweep } from "@/lib/sweep";

export const runtime = "nodejs";

/**
 * POST /api/scan-usdc
 * Body: { orderId, chainId, txHash?, order? }
 *
 * Confirms a USDC payment for an order when the user paid by QR code or by
 * copying the address (the tx hash isn't known in advance):
 *  - with txHash: verify that exact transaction (same as /api/confirm-usdc,
 *    minus the sender check — the payer isn't a connected wallet here)
 *  - without txHash: scan recent USDC Transfer logs to the order's receiver
 *    and match the newest unclaimed transfer >= the order total.
 *
 * On success the order is marked paid and delivered, and the sender's wallet
 * address is recorded so the payment shows up in that wallet's cloud history.
 *
 * `order` (optional) is the client receipt-journal entry for this order. The
 * server store is ephemeral on serverless platforms, so when the order is
 * missing here it's rebuilt from that entry — with the receiver always taken
 * from the server (paymentReceiver()), never from the client.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, chainId, txHash, order: clientOrder } = body;

    if (!orderId || !chainId) {
      return NextResponse.json(
        { error: "Missing orderId or chainId." },
        { status: 400 },
      );
    }

    let order = await getOrder(orderId);
    if (!order && clientOrder) {
      order = await recreateOrderFromClient(orderId, clientOrder);
    }
    if (!order) {
      return NextResponse.json(
        { error: "Order not found. Please create a new order from the top-up page." },
        { status: 404 },
      );
    }
    if (order.status === "delivered" || order.status === "paid") {
      return NextResponse.json({ ok: true, txHash: order.txHash, order });
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
    const usedTxHashes = orders
      .filter((o) => o.id !== orderId && o.txHash)
      .map((o) => o.txHash!.toLowerCase());
    if (txHash && usedTxHashes.includes(String(txHash).toLowerCase())) {
      return NextResponse.json(
        { error: "This transaction has already been used for another order." },
        { status: 422 },
      );
    }

    // Transient errors (payment may still be settling) keep polling alive;
    // anything definitive tells the client to stop.
    const TRANSIENT = /still settling|not indexed|wait a moment|No USDC transfer/i;

    let txHashFound: string;
    let sender: string | undefined;

    if (txHash) {
      const result = await verifyUsdcPayment({
        chain,
        txHash,
        expectedTo: order.receiver,
        expectedAmountUsd: order.usdTotal.toFixed(2),
      });
      if (!result.ok) {
        return NextResponse.json(
          { error: result.reason, retryable: TRANSIENT.test(result.reason ?? "") },
          { status: 422 },
        );
      }
      txHashFound = txHash;
      sender = result.from;
    } else {
      const found = await scanUsdcTransfer({
        chain,
        to: order.receiver,
        expectedAmountUsd: order.usdTotal.toFixed(2),
        excludeTxHashes: usedTxHashes,
        since: new Date(order.createdAt).getTime(),
      });
      if (!found) {
        // The payment may have just landed but not surfaced to this specific
        // scan yet (RPC indexing lag). Run the server-side sweep — it matches
        // transfers to every pending order, including this one — then re-check
        // so a just-arrived payment completes on this very poll.
        await runSweep();
        const after = await getOrder(orderId);
        if (after && (after.status === "delivered" || after.status === "paid")) {
          return NextResponse.json({ ok: true, txHash: after.txHash, order: after });
        }
        return NextResponse.json(
          {
            error:
              "No USDC transfer to this address has been detected yet. If you've already sent it, it may still be settling. Wait a moment and check again.",
            retryable: true,
          },
          { status: 422 },
        );
      }
      txHashFound = found.txHash;
      sender = found.from;
    }

    // Record the on-chain proof + the payer's wallet (cloud history key), then mark paid + deliver.
    await updateOrder(orderId, {
      txHash: txHashFound,
      chainId: chain.chain.id,
      wallet: typeof sender === "string" ? sender.toLowerCase() : undefined,
    });
    const fresh = await fulfillOrder(orderId);
    return NextResponse.json({ ok: true, txHash: txHashFound, order: fresh });
  } catch (err) {
    console.error("[scan-usdc] error", err);
    return NextResponse.json(
      { error: "Something went wrong while confirming the payment." },
      { status: 500 },
    );
  }
}

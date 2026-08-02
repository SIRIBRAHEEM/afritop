import { getOrder } from "@/lib/store";
import { orderToEntry } from "@/lib/receipt-journal";
import { ReceiptCard } from "@/components/ReceiptCard";
import { PollOrder } from "./poll-order";
import { ReceiptFallback } from "./receipt-fallback";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  const order = orderId ? await getOrder(orderId) : undefined;

  if (!order) {
    // Server store may be empty (ephemeral on serverless) — the client receipt
    // journal can still render the full receipt.
    return <ReceiptFallback orderId={orderId ?? ""} />;
  }

  if (order.status === "pending_payment" || order.status === "paid") {
    return <PollOrder orderId={order.id} />;
  }

  return <ReceiptCard entry={orderToEntry(order)} />;
}

import { redirect } from "next/navigation";
import { getOrder } from "@/lib/store";
import { receiverIsDemo } from "@/lib/chains";
import { isCircleConfigured } from "@/lib/circle";
import { PayGate } from "@/components/PayGate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const { orderId } = await params;
  const { cancelled } = await searchParams;
  const order = await getOrder(orderId);

  // Paid orders go straight to the receipt. Everything else — including a
  // missing order (the server store is ephemeral on serverless platforms) —
  // is rendered by PayGate, which can resolve the order from the client
  // receipt journal saved by /buy before navigating here.
  if (order && (order.status === "delivered" || order.status === "paid")) {
    redirect(`/success?orderId=${orderId}`);
  }

  return (
    <PayGate
      orderId={orderId}
      serverOrder={order}
      demoMode={receiverIsDemo()}
      circleConfigured={isCircleConfigured()}
      cancelled={cancelled === "1"}
    />
  );
}

import { redirect } from "next/navigation";
import { getOrder } from "@/lib/store";
import { receiverIsDemo } from "@/lib/chains";
import { isCircleConfigured } from "@/lib/circle";
import { PayPanel } from "@/components/PayPanel";

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

  if (!order) {
    return (
      <div className="grid flex-1 place-items-center bg-paper px-4 py-24">
        <div className="max-w-md rounded-3xl border border-ink-100 bg-white p-8 text-center shadow-xl shadow-ink-900/5">
          <span className="text-4xl">🔍</span>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink-900">Order not found</h1>
          <p className="mt-2 text-sm text-ink-500">
            We couldn&apos;t find that order. It may have expired or already been paid.
          </p>
          <a
            href="/buy"
            className="mt-6 inline-flex rounded-full bg-ink-900 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-ink-800"
          >
            Back to top-up
          </a>
        </div>
      </div>
    );
  }

  if (order.status === "delivered" || order.status === "paid") {
    redirect(`/success?orderId=${orderId}`);
  }

  return (
    <PayPanel
      order={{
        id: order.id,
        usdTotal: order.usdTotal,
        service: order.service,
        provider: order.provider.short,
        providerId: order.provider.id,
        providerName: order.provider.name,
        recipient: order.recipient,
        recipientLabel: order.recipientLabel,
        amountLocal: order.amountLocal,
        currency: order.currency,
        countryCode: order.countryCode,
        receiver: order.receiver ?? "",
      }}
      demoMode={receiverIsDemo()}
      circleConfigured={isCircleConfigured()}
      cancelled={cancelled === "1"}
    />
  );
}

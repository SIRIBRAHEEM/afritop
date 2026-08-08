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
        <div className="max-w-md border-2 border-ink-950 bg-surface p-8 text-center">
          <span className="mx-auto grid size-16 place-items-center border-2 border-ink-950 bg-paper text-ink-950">
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink-900">Order not found</h1>
          <p className="mt-2 text-sm text-ink-500">
            We couldn&apos;t find that order. It may have expired or already been paid.
          </p>
          <a
            href="/buy"
            className="btn-cta mt-6 inline-flex border-2 border-ink-950 bg-night px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-ink-800"
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

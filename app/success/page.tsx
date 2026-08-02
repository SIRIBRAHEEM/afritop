import Link from "next/link";
import { getOrder } from "@/lib/store";
import { formatLocal, formatUsd } from "@/lib/fx";
import { getUsdcChain } from "@/lib/chains";

function txExplorerLink(txHash: string, chainId: number): string {
  const chain = getUsdcChain(chainId);
  if (!chain) return `https://etherscan.io/tx/${txHash}`;
  return chain.explorerTx(txHash);
}
import { StatusChip } from "@/components/StatusChip";
import { PollOrder } from "./poll-order";
import { CopyToken } from "./copy-token";

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
    return (
      <div className="grid flex-1 place-items-center bg-paper px-4 py-24">
        <div className="max-w-md rounded-3xl border border-ink-100 bg-white p-8 text-center shadow-xl">
          <span className="text-4xl">🔍</span>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink-900">Order not found</h1>
          <p className="mt-2 text-sm text-ink-500">
            We couldn&apos;t find that order. If you just paid, give it a few seconds and refresh.
          </p>
          <Link
            href="/buy"
            className="mt-6 inline-flex rounded-full bg-ink-900 px-6 py-3 text-sm font-bold text-white"
          >
            Back to top-up
          </Link>
        </div>
      </div>
    );
  }

  if (order.status === "pending_payment" || order.status === "paid") {
    return <PollOrder orderId={order.id} />;
  }

  const delivered = order.status === "delivered";
  const failed = order.status === "failed";

  return (
    <div className="flex-1 bg-paper">
      <div className="mx-auto max-w-xl px-4 py-14 sm:py-20">
        <div className="animate-pop overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-xl shadow-ink-900/5">
          {/* Header */}
          <div
            className={
              delivered
                ? "bg-gradient-to-br from-brand-600 to-brand-800 px-7 py-10 text-center text-white"
                : "bg-gradient-to-br from-red-500 to-red-700 px-7 py-10 text-center text-white"
            }
          >
            <span className="relative mx-auto grid size-16 place-items-center">
              <span
                className={
                  delivered
                    ? "animate-ping-slow absolute inset-0 rounded-full bg-white/30"
                    : "absolute inset-0 rounded-full bg-white/20"
                }
              />
              <span className="relative grid size-16 place-items-center rounded-full bg-white text-3xl shadow-lg">
                {delivered ? (
                  <svg viewBox="0 0 24 24" className="size-8 text-brand-600" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  <span className="text-3xl">⚠️</span>
                )}
              </span>
            </span>
            <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">
              {delivered ? "Delivered!" : failed ? "Delivery failed" : "Payment received"}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-white/80">
              {delivered
                ? `Your ${formatLocal(order.amountLocal, order.currency)} ${order.provider.short} ${
                    order.service
                  } top-up has been delivered to ${order.recipient}.`
                : failed
                  ? "We couldn't complete the delivery. Your payment will be reviewed — please contact support."
                  : "We're working on it."}
            </p>
          </div>

          {/* Body */}
          <div className="px-7 py-7">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <Detail label="Order" value={order.id} mono />
              <Detail label="Status" value={<StatusChip status={order.status} />} />
              <Detail label="Service" value={order.service} capitalize />
              <Detail label="Provider" value={order.provider.name} />
              <Detail label={order.recipientLabel} value={order.recipient} mono />
              <Detail label="Amount" value={formatLocal(order.amountLocal, order.currency)} />
            </dl>

            {order.bundle && (
              <div className="mt-5 flex items-center justify-between rounded-2xl bg-ink-50 px-4 py-3 text-sm">
                <span className="font-semibold text-ink-500">Bundle</span>
                <span className="font-bold text-ink-900">
                  {order.bundle.size} · {order.bundle.validity}
                </span>
              </div>
            )}

            {/* Electricity token */}
            {order.token && (
              <div className="mt-5 rounded-2xl bg-ink-950 p-5 text-center">
                <p className="text-[11px] font-bold uppercase tracking-widest text-ink-400">
                  Recharge token · 20 digits
                </p>
                <p className="mt-3 font-mono text-2xl font-bold tracking-[0.15em] text-sun-300 sm:text-3xl">
                  {order.token}
                </p>
                <div className="mt-4 flex justify-center">
                  <CopyToken token={order.token} />
                </div>
                <p className="mt-4 text-xs leading-relaxed text-ink-400">
                  Enter this token on your meter to credit your account. Keep it safe.
                </p>
              </div>
            )}

            {order.message && delivered && (
              <p className="mt-5 rounded-2xl border border-sun-200 bg-sun-50 px-4 py-3 text-xs leading-relaxed text-sun-800">
                ℹ️ {order.message}
              </p>
            )}

            <div className="mt-5 flex items-center justify-between rounded-2xl border border-dashed border-ink-200 px-4 py-3 text-sm">
              <span className="font-bold text-ink-900">Paid</span>
              <span className="font-mono text-base font-extrabold text-brand-700">
                {formatUsd(order.usdTotal)}
                <span className="ml-2 text-xs font-semibold text-ink-400">
                  {order.paymentMethod === "circle" ? "USDC · Circle" : "USDC · wallet"}
                </span>
              </span>
            </div>

            {order.paymentMethod === "wallet" && order.txHash && order.chainId && (
              <div className="mt-4 flex items-center justify-between rounded-2xl bg-ink-50 px-4 py-3 text-sm">
                <span className="font-semibold text-ink-500">On-chain receipt</span>
                <a
                  href={txExplorerLink(order.txHash, order.chainId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-bold text-brand-700 hover:text-brand-600 hover:underline"
                >
                  View transaction
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17 17 7M8 7h9v9" />
                  </svg>
                </a>
              </div>
            )}

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/buy"
                className="flex-1 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-6 py-3.5 text-center text-sm font-extrabold text-white shadow-lg shadow-brand-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                Buy another top-up
              </Link>
              <Link
                href="/transactions"
                className="flex-1 rounded-2xl border-2 border-ink-100 bg-white px-6 py-3.5 text-center text-sm font-extrabold text-ink-700 transition-colors hover:border-ink-200 hover:bg-ink-50"
              >
                View transactions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
  capitalize,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold text-ink-400">{label}</dt>
      <dd className={`mt-1 text-sm font-bold text-ink-900 ${mono ? "font-mono" : ""} ${capitalize ? "capitalize" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

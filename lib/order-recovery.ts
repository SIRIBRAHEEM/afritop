import { addOrder, type Order } from "@/lib/store";
import { paymentReceiver } from "@/lib/chains";
import { SERVICES, type ServiceId } from "@/lib/catalog";

/** Smallest order total we'll rebuild — matches the $0.05 platform-fee floor. */
const MIN_USD_TOTAL = 0.05;

/**
 * Rebuilds a server order that the ephemeral store lost (serverless cold
 * starts / instance rotation) from the client's receipt-journal entry, which
 * /buy saves before navigating to the pay page.
 *
 * The payment destination is ALWAYS server-derived (`paymentReceiver()`), never
 * client-supplied. Amount and shape are validated so a forged payload can't
 * slip below the fee floor. Delivery is still gated by real on-chain
 * verification in the calling route.
 */
export async function recreateOrderFromClient(
  orderId: string,
  c: unknown,
): Promise<Order | undefined> {
  if (!c || typeof c !== "object") return undefined;
  const p = c as Record<string, unknown>;
  if (p.id !== orderId) return undefined;
  if (typeof p.service !== "string" || !SERVICES.some((s) => s.id === p.service)) return undefined;

  const usdTotal = Number(p.usdTotal);
  if (!Number.isFinite(usdTotal) || usdTotal < MIN_USD_TOTAL) return undefined;

  const amountLocal = Number(p.amountLocal);
  if (!Number.isFinite(amountLocal) || amountLocal <= 0) return undefined;

  if (typeof p.recipient !== "string" || p.recipient.length === 0) return undefined;
  if (typeof p.providerId !== "string" || typeof p.providerName !== "string" || typeof p.providerShort !== "string") {
    return undefined;
  }

  const order: Order = {
    id: orderId,
    createdAt: typeof p.createdAt === "string" ? p.createdAt : new Date().toISOString(),
    status: "pending_payment",
    service: p.service as ServiceId,
    countryCode: typeof p.countryCode === "string" ? p.countryCode : "NG",
    provider: { id: p.providerId, name: p.providerName, short: p.providerShort },
    recipientLabel: typeof p.recipientLabel === "string" ? p.recipientLabel : "Phone",
    recipient: p.recipient,
    amountLocal,
    currency: typeof p.currency === "string" ? p.currency : "USD",
    usdSubtotal: Number(p.usdSubtotal) || usdTotal,
    fee: Number(p.fee) || 0,
    usdTotal,
    bundle:
      p.bundle && typeof p.bundle === "object"
        ? (p.bundle as { size: string; validity: string })
        : undefined,
    paymentMethod: "wallet",
    receiver: paymentReceiver(), // always server-derived, never client-supplied
  };
  await addOrder(order);
  return order;
}

import { getOrder, updateOrder, type Order } from "@/lib/store";
import { getCountry } from "@/lib/catalog";
import { resolveVendor } from "@/lib/vendors";
import type { VendRequest } from "@/lib/vendors/types";

/** Generate a standard 20-digit prepaid electricity token, grouped like "1234-5678-…". */
function generateElectricityToken(): string {
  let digits = "";
  for (let i = 0; i < 20; i++) digits += Math.floor(Math.random() * 10);
  return digits.replace(/(.{4})/g, "$1-").slice(0, 24);
}

/**
 * Marks an order as paid and executes delivery through the vendor layer
 * (`lib/vendors`).
 *
 *  - A configured vendor → its real result (delivered / failed, with the
 *    vendor's reference and, for electricity, the meter token).
 *  - airtime with no vendor at all → FAIL. The customer has paid real USDC on
 *    Arc mainnet, so we surface a failure for refund instead of inventing airtime.
 *  - data / electricity with no vendor for that country → the clearly-labelled
 *    simulated pipeline (`simulated: true`), so nothing simulated is ever
 *    reported as a plain, unqualified delivery.
 */
export async function fulfillOrder(orderId: string): Promise<Order> {
  const order = await getOrder(orderId);
  if (!order) throw new Error("Order not found");
  // Only fully-delivered orders are terminal. If an order is already "paid"
  // (e.g. a retry arrived mid-fulfilment), resume delivery instead of bailing,
  // so we never leave an order stuck in the "paid" state.
  if (order.status === "delivered") return order;

  await updateOrder(orderId, { status: "paid" });
  console.log("[fulfill] order", orderId, "service", order.service, "recipient", order.recipient, "amount", order.amountLocal, order.currency);

  const country = getCountry(order.countryCode);
  const request: VendRequest = {
    orderId: order.id,
    service: order.service,
    countryCode: order.countryCode,
    currency: order.currency,
    networkId: order.provider.id,
    recipient: order.recipient,
    phonePrefix: country?.phonePrefix ?? "",
    amountLocal: order.amountLocal,
    bundleId: order.bundleId,
  };

  const vendor = resolveVendor(request);

  if (vendor) {
    console.log("[fulfill] vending via", vendor.id, "for", order.service, order.countryCode);
    const result = await vendor.vend(request);
    console.log("[fulfill]", vendor.id, "result", JSON.stringify(result));
    await updateOrder(orderId, {
      status: result.delivered ? "delivered" : "failed",
      simulated: false,
      providerRef: result.ref,
      token: result.token,
      message: result.message,
    });
  } else if (order.service === "airtime") {
    // Real money, no delivery path. This must surface as a failure so it gets
    // refunded — never as a fake "delivered" credit.
    await updateOrder(orderId, {
      status: "failed",
      message:
        "Airtime delivery isn't configured on this server, so the top-up couldn't be sent. Contact support for a refund.",
    });
  } else if (order.service === "electricity") {
    const token = generateElectricityToken();
    await updateOrder(orderId, {
      status: "delivered",
      simulated: true,
      token,
      message:
        "Simulated token — no vending partner is connected for your country yet, so this token isn't valid on your meter. Contact support for a refund.",
    });
  } else {
    // data bundles
    await updateOrder(orderId, {
      status: "delivered",
      simulated: true,
      message:
        "Simulated data bundle — no vending partner is connected for your country yet, so no bundle was issued. Contact support for a refund.",
    });
  }

  const fresh = await getOrder(orderId);
  if (!fresh) throw new Error("Order missing after fulfillment");
  return fresh;
}

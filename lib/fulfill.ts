import { getOrder, updateOrder, type Order } from "@/lib/store";
import { sendAirtime, isAirtimeConfigured } from "@/lib/africastalking";

/** Generate a standard 20-digit prepaid electricity token, grouped like "1234-5678-…". */
function generateElectricityToken(): string {
  let digits = "";
  for (let i = 0; i < 20; i++) digits += Math.floor(Math.random() * 10);
  return digits.replace(/(.{4})/g, "$1-").slice(0, 24);
}

/**
 * Marks an order as paid and executes delivery:
 *  - airtime     → real Africa's Talking send. If it isn't configured the order
 *                  FAILS rather than inventing a credit, because the customer
 *                  has already paid real USDC on Arc mainnet.
 *  - electricity → simulated token vending, flagged `simulated` (wire a vending
 *                  partner like VTpass here)
 *  - data        → simulated bundle, flagged `simulated`
 *
 * `simulated: true` is what the receipt and success page read to tell the
 * customer the top-up wasn't issued by a real partner. Nothing simulated is
 * ever reported as a plain, unqualified delivery.
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

  if (order.service === "airtime") {
    console.log("[fulfill] airtime configured:", isAirtimeConfigured());
    if (!isAirtimeConfigured()) {
      // Real money, no delivery path. This must surface as a failure so it gets
      // refunded — never as a fake "delivered" credit.
      await updateOrder(orderId, {
        status: "failed",
        message:
          "Airtime delivery isn't configured on this server, so the top-up couldn't be sent. Contact support for a refund.",
      });
    } else {
      console.log("[fulfill] calling sendAirtime with", JSON.stringify({
        phoneNumber: order.recipient,
        amount: String(order.amountLocal),
        currencyCode: order.currency,
      }));
      const result = await sendAirtime([
        {
          phoneNumber: order.recipient,
          amount: String(order.amountLocal),
          currencyCode: order.currency,
        },
      ]);
      console.log("[fulfill] sendAirtime result", JSON.stringify(result));

      if (result) {
        await updateOrder(orderId, {
          status: result.delivered ? "delivered" : "failed",
          providerRef: result.ref,
          message: result.message,
        });
      } else {
        await updateOrder(orderId, {
          status: "failed",
          message: "Airtime delivery failed. Contact support for a refund.",
        });
      }
    }
  } else if (order.service === "electricity") {
    const token = generateElectricityToken();
    await updateOrder(orderId, {
      status: "delivered",
      simulated: true,
      token,
      message:
        "Simulated token — no vending partner is connected yet, so this token isn't valid on your meter. Contact support for a refund.",
    });
  } else {
    // data bundles
    await updateOrder(orderId, {
      status: "delivered",
      simulated: true,
      message:
        "Simulated data bundle — no vending partner is connected yet, so no bundle was issued. Contact support for a refund.",
    });
  }

  const fresh = await getOrder(orderId);
  if (!fresh) throw new Error("Order missing after fulfillment");
  return fresh;
}

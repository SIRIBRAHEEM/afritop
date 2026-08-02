import { getOrder, updateOrder, type Order } from "@/lib/store";
import { sendAirtime, simulateDelivery } from "@/lib/africastalking";

/** Generate a standard 20-digit prepaid electricity token, grouped like "1234-5678-…". */
function generateElectricityToken(): string {
  let digits = "";
  for (let i = 0; i < 20; i++) digits += Math.floor(Math.random() * 10);
  return digits.replace(/(.{4})/g, "$1-").slice(0, 24);
}

/**
 * Marks an order as paid and executes delivery:
 *  - airtime     → real Africa's Talking send (simulated when sandbox key is absent)
 *  - electricity → simulated token vending (wire a vending partner like VTpass here)
 *  - data        → simulated bundle (wire a vending partner here)
 */
export async function fulfillOrder(orderId: string): Promise<Order> {
  const order = await getOrder(orderId);
  if (!order) throw new Error("Order not found");
  // Only fully-delivered orders are terminal. If an order is already "paid"
  // (e.g. a retry arrived mid-fulfilment), resume delivery instead of bailing,
  // so we never leave an order stuck in the "paid" state.
  if (order.status === "delivered") return order;

  await updateOrder(orderId, { status: "paid" });

  if (order.service === "airtime") {
    const result = await sendAirtime([
      {
        phoneNumber: order.recipient,
        amount: String(order.amountLocal),
        currencyCode: order.currency,
      },
    ]);

    if (result) {
      await updateOrder(orderId, {
        status: result.delivered ? "delivered" : "failed",
        providerRef: result.ref,
        message: result.message,
      });
    } else {
      // No API key configured → simulate a successful credit so the demo works end-to-end.
      await simulateDelivery(1100);
      await updateOrder(orderId, {
        status: "delivered",
        message: "Simulated credit — add your Africa's Talking key to go live.",
      });
    }
  } else if (order.service === "electricity") {
    await simulateDelivery(1500);
    const token = generateElectricityToken();
    await updateOrder(orderId, {
      status: "delivered",
      token,
      message: "Simulated token — connect a vending partner to go live.",
    });
  } else {
    // data bundles
    await simulateDelivery(1200);
    await updateOrder(orderId, {
      status: "delivered",
      message: "Simulated data bundle — connect a vending partner to go live.",
    });
  }

  const fresh = await getOrder(orderId);
  if (!fresh) throw new Error("Order missing after fulfillment");
  return fresh;
}

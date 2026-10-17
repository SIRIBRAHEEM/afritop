import { Suspense } from "react";
import { paymentsEnabled } from "@/lib/chains";
import { buildDeliveryReport } from "@/lib/delivery";
import { BuyFlow } from "./buy-flow";

export const dynamic = "force-dynamic";

/**
 * Server wrapper for the buy flow.
 *
 * It reads whether this deployment can actually accept payments (a valid
 * `USDC_RECEIVER` is configured) and which (country, service) routes have a
 * real vending partner, then hands both to the client flow, so the Pay button
 * can never promise something the server would refuse. See `paymentsEnabled`
 * in `lib/chains.ts` and `buildDeliveryReport` in `lib/delivery.ts`.
 */
export default function BuyPage() {
  return (
    <Suspense>
      <BuyFlow paymentsEnabled={paymentsEnabled()} delivery={buildDeliveryReport()} />
    </Suspense>
  );
}

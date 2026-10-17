/**
 * Server-computed delivery capability, handed to client components as plain
 * data. Client bundles never read `process.env`, so the "live vs simulated"
 * decision has to be made here and passed down.
 */

import { COUNTRIES, SERVICES, type DeliveryReport, type DeliveryStatus } from "@/lib/catalog";
import { canDeliver } from "@/lib/vendors";

/** Which (country, service) routes have a configured vending partner. */
export function buildDeliveryReport(): DeliveryReport {
  const byRoute: Record<string, DeliveryStatus> = {};
  for (const country of COUNTRIES) {
    for (const service of SERVICES) {
      byRoute[`${country.code}:${service.id}`] = canDeliver(service.id, country.code) ? "live" : "simulated";
    }
  }
  return { byRoute };
}

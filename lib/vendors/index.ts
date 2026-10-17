/**
 * Vendor registry.
 *
 * Order matters: the first vendor that covers a request *and* is configured
 * wins. Reloadly is the one telco partner (airtime + data, all four countries);
 * VTPass covers Nigerian prepaid electricity. Africa's Talking is still present
 * as a temporary airtime fallback so live airtime doesn't go dark before
 * Reloadly is configured — remove it (and `lib/africastalking.ts`) once Reloadly
 * credentials are live.
 */

import { isAirtimeConfigured, sendAirtime } from "@/lib/africastalking";
import reloadly from "./reloadly";
import vtpass from "./vtpass";
import type { ServiceKind, VendRequest, VendResult, Vendor } from "./types";

export type { ServiceKind, VendRequest, VendResult, Vendor } from "./types";

/** Legacy airtime path — kept as a fallback behind Reloadly. */
const africastalking: Vendor = {
  id: "africastalking",
  name: "Africa's Talking",
  covers: (service: ServiceKind) => service === "airtime",
  isConfigured: isAirtimeConfigured,
  async vend(request: VendRequest): Promise<VendResult> {
    const result = await sendAirtime([
      {
        phoneNumber: request.recipient,
        amount: String(request.amountLocal),
        currencyCode: request.currency,
      },
    ]);
    if (!result) return { delivered: false, message: "Africa's Talking isn't configured." };
    return { delivered: result.delivered, ref: result.ref, message: result.message };
  },
};

export const VENDORS: Vendor[] = [reloadly, vtpass, africastalking];

/** The vendor that will actually run this request, if any. */
export function resolveVendor(request: VendRequest): Vendor | undefined {
  return VENDORS.find((v) => v.covers(request.service, request.countryCode) && v.isConfigured());
}

/**
 * Whether we can deliver (service, country) with real money attached. When this
 * is false the route is either refused or served by the clearly-labelled
 * simulated pipeline — never reported as a real delivery.
 */
export function canDeliver(service: ServiceKind, countryCode: string): boolean {
  return VENDORS.some((v) => v.covers(service, countryCode) && v.isConfigured());
}

/** Any real vending partner configured at all? Drives the coarse UI badge. */
export function anyVendorConfigured(): boolean {
  return VENDORS.some((v) => v.isConfigured());
}

/**
 * When set, a service we can't deliver for real is refused at checkout instead
 * of falling back to simulation. Recommended before scaling real volume.
 */
export function strictDelivery(): boolean {
  return process.env.AFRITOP_REQUIRE_REAL_DELIVERY === "true";
}

/**
 * VTPass — prepaid electricity vending for Nigeria.
 *
 * One integration reaches every Nigerian DISCO (Ikeja, Eko, Abuja, PH, Ibadan,
 * Enugu, Kano, Jos, Kaduna, Benin, Aba, Yola…) and returns the meter token
 * synchronously, which is exactly the `token` the receipt already renders.
 *
 *   Live API     https://vtpass.com/api
 *   Sandbox API  https://sandbox.vtpass.com/api
 *   Docs         https://vtpass.com/documentation
 *
 * Auth: POST requests carry `api-key` + `secret-key` headers. VTPass debits
 * *your* prefunded VTPass wallet, not the customer — keep it topped up or
 * vending fails even when the customer has already paid.
 *
 * Required configuration (see `.env.example`):
 *   VTPASS_API_KEY, VTPASS_SECRET_KEY   — issued in the VTPass dashboard
 *   VTPASS_ENV=live                     — anything else uses the sandbox
 *   VTPASS_FALLBACK_PHONE               — contact phone VTPass requires on a
 *                                         vend (we don't collect one for
 *                                         meters). A token SMS is sent here.
 *   VTPASS_SERVICE_IDS                  — {"electricity:ikeja":"ikeja-electric", …}
 */

import type { ServiceKind, VendRequest, VendResult, Vendor } from "./types";
import { vtpassServiceId, vtpassServiceIdCount } from "./codes";

const LIVE_BASE = "https://vtpass.com/api";
const SANDBOX_BASE = "https://sandbox.vtpass.com/api";

export function vtpassBaseUrl(): string {
  return process.env.VTPASS_ENV === "live" ? LIVE_BASE : SANDBOX_BASE;
}

export function isVtpassConfigured(): boolean {
  return Boolean(
    process.env.VTPASS_API_KEY &&
      process.env.VTPASS_SECRET_KEY &&
      process.env.VTPASS_FALLBACK_PHONE &&
      vtpassServiceIdCount() > 0,
  );
}

/**
 * VTPass requires a request id whose first 12 digits are the timestamp
 * `YYYYMMDDHHMM` in Africa/Lagos (UTC+1, no DST). We append random digits to
 * keep it unique across retries.
 */
function makeRequestId(): string {
  const lagos = new Date(Date.now() + 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, "0");
  const stamp =
    `${lagos.getUTCFullYear()}${p(lagos.getUTCMonth() + 1)}${p(lagos.getUTCDate())}` +
    `${p(lagos.getUTCHours())}${p(lagos.getUTCMinutes())}`;
  return `${stamp}${Math.floor(Math.random() * 1_000_000).toString().padStart(6, "0")}`;
}

function extractToken(data: Record<string, unknown>): string | undefined {
  const content = (data.content ?? {}) as Record<string, unknown>;
  const tx = (content.transactions ?? {}) as Record<string, unknown>;
  const candidates = [
    tx.purchased_code,
    tx.token,
    tx.mainToken,
    content.purchased_code,
    content.token,
    data.purchased_code,
    data.token,
  ];
  const found = candidates.find((v): v is string => typeof v === "string" && v.length > 0);
  return found;
}

const vtpass: Vendor = {
  id: "vtpass",
  name: "VTPass",
  covers(service: ServiceKind, countryCode: string): boolean {
    // Scoped to Nigerian electricity — airtime and data go through Reloadly.
    return service === "electricity" && countryCode === "NG";
  },
  isConfigured: isVtpassConfigured,
  async vend(request: VendRequest): Promise<VendResult> {
    if (!isVtpassConfigured()) {
      return { delivered: false, message: "VTPass isn't configured on this server." };
    }

    const serviceID = vtpassServiceId("electricity", request.networkId);
    if (!serviceID) {
      return {
        delivered: false,
        message: `No VTPass service id is mapped for ${request.networkId} (see VTPASS_SERVICE_IDS).`,
      };
    }

    const requestId = makeRequestId();
    try {
      const res = await fetch(`${vtpassBaseUrl()}/pay`, {
        method: "POST",
        headers: {
          "api-key": process.env.VTPASS_API_KEY as string,
          "secret-key": process.env.VTPASS_SECRET_KEY as string,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          request_id: requestId,
          serviceID,
          billersCode: request.recipient,
          variation_code: process.env.VTPASS_ELECTRICITY_TYPE || "prepaid",
          amount: request.amountLocal,
          phone: process.env.VTPASS_FALLBACK_PHONE,
        }),
        cache: "no-store",
      });

      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        console.error("[vtpass] vend rejected", res.status, JSON.stringify(data));
        return { delivered: false, ref: requestId, message: `VTPass error (${res.status})` };
      }

      const content = (data.content ?? {}) as Record<string, unknown>;
      const tx = (content.transactions ?? {}) as Record<string, unknown>;
      const code = String(data.code ?? "");
      const status = String(tx.status ?? "").toLowerCase();
      const ref = String(tx.transactionId ?? requestId);
      const token = extractToken(data);

      // VTPass returns code "000" on acceptance; the transaction itself is
      // "delivered" (token issued) or "pending" (will complete shortly).
      const delivered = code === "000" && (status === "delivered" || status === "pending");
      const description = typeof tx.response_description === "string" ? tx.response_description : undefined;
      return {
        delivered,
        ref,
        token,
        message: delivered ? undefined : description || `VTPass reported "${status || code || "unknown"}"`,
      };
    } catch (err) {
      console.error("[vtpass] request failed", err);
      return { delivered: false, ref: requestId, message: "VTPass request failed." };
    }
  },
};

export default vtpass;

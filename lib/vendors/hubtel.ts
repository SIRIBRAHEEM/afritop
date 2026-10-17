/**
 * Hubtel — prepaid/postpaid electricity vending for Ghana (ECG, NEDCo).
 *
 *   Base       https://cs.hubtel.com/commissionservices/{DisbursementAccount}
 *   Auth       Authorization: Basic base64("{API_ID}:{API_KEY}")
 *   Vend       POST /{ServiceID}   { Destination, Amount, ClientReference,
 *                                    Extradata: { bundle: <meter number> } }
 *   Status     GET  /{DisbursementAccount}/status?clientReference=…
 *   Docs       https://developers.hubtel.com
 *
 * ⚠ CAUTION — read before enabling.
 * Hubtel's Commission Services docs never name a field that carries the prepaid
 * *meter token*. A vend can succeed and debit your float while the customer
 * still has nothing to punch into the meter. Until Hubtel support confirms where
 * the token is returned (the callback is the likely place), keep
 * `HUBTEL_ELECTRICITY_ENABLED` unset: the vendor stays off and Ghana electricity
 * remains on the clearly-labelled simulated pipeline rather than silently
 * taking money for a token we can't deliver.
 *
 * Required configuration (see `.env.example`):
 *   HUBTEL_ACCOUNT_NUMBER, HUBTEL_API_ID, HUBTEL_API_KEY
 *   HUBTEL_ELECTRICITY_ENABLED=true
 *   HUBTEL_SERVICE_IDS   {"electricity:GH:ecg":"<ServiceID>","electricity:GH:nedco":"<ServiceID>"}
 */

import { Buffer } from "buffer";
import type { ServiceKind, VendRequest, VendResult, Vendor } from "./types";
import { hubtelServiceId, hubtelServiceIdCount } from "./codes";

const BASE = "https://cs.hubtel.com/commissionservices";

export function isHubtelConfigured(): boolean {
  return Boolean(
    process.env.HUBTEL_ELECTRICITY_ENABLED === "true" &&
      process.env.HUBTEL_ACCOUNT_NUMBER &&
      process.env.HUBTEL_API_ID &&
      process.env.HUBTEL_API_KEY &&
      hubtelServiceIdCount() > 0,
  );
}

function authHeader(): string {
  const raw = `${process.env.HUBTEL_API_ID}:${process.env.HUBTEL_API_KEY}`;
  return `Basic ${Buffer.from(raw).toString("base64")}`;
}

function extractToken(data: Record<string, unknown>): string | undefined {
  const inner = (data.Data ?? data.data ?? {}) as Record<string, unknown>;
  const candidates = [inner.Token, inner.token, inner.MeterToken, data.Token, data.token];
  return candidates.find((v): v is string => typeof v === "string" && v.length > 0);
}

const hubtel: Vendor = {
  id: "hubtel",
  name: "Hubtel",
  covers(service: ServiceKind, countryCode: string): boolean {
    return service === "electricity" && countryCode === "GH";
  },
  isConfigured: isHubtelConfigured,
  async vend(request: VendRequest): Promise<VendResult> {
    if (!isHubtelConfigured()) {
      return { delivered: false, message: "Hubtel isn't configured on this server." };
    }

    const account = process.env.HUBTEL_ACCOUNT_NUMBER as string;
    const serviceId = hubtelServiceId("electricity", request.countryCode, request.networkId);
    if (!serviceId) {
      return {
        delivered: false,
        message: `No Hubtel service id is mapped for ${request.networkId} (see HUBTEL_SERVICE_IDS).`,
      };
    }

    try {
      const res = await fetch(`${BASE}/${account}/${serviceId}`, {
        method: "POST",
        headers: {
          Authorization: authHeader(),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          Destination: request.recipient,
          Amount: request.amountLocal,
          ClientReference: request.orderId,
          ...(process.env.HUBTEL_CALLBACK_URL ? { CallbackUrl: process.env.HUBTEL_CALLBACK_URL } : {}),
          Extradata: { bundle: request.recipient },
        }),
        cache: "no-store",
      });

      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        console.error("[hubtel] vend rejected", res.status, JSON.stringify(data));
        return { delivered: false, message: `Hubtel error (${res.status})` };
      }

      const inner = (data.Data ?? data.data ?? {}) as Record<string, unknown>;
      const code = String(data.ResponseCode ?? data.responseCode ?? "");
      // 0000 = completed, 0001 = accepted/pending. Anything else = failed.
      const delivered = code === "0000" || code === "0001";
      const token = extractToken(data);
      return {
        delivered,
        ref: inner.TransactionId ? String(inner.TransactionId) : request.orderId,
        token,
        message: delivered
          ? token
            ? undefined
            : "Vend accepted, but Hubtel returned no meter token — check the callback/support."
          : String(data.Message ?? data.message ?? `Hubtel reported "${code || "unknown"}"`),
      };
    } catch (err) {
      console.error("[hubtel] request failed", err);
      return { delivered: false, message: "Hubtel request failed." };
    }
  },
};

export default hubtel;

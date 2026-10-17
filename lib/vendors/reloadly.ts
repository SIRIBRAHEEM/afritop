/**
 * Reloadly — airtime + data bundles, across every country we serve.
 *
 * One integration covers Nigeria, Ghana, Kenya and South Africa, which is why
 * this is the primary partner for airtime and data. Reloadly is self-serve:
 * create an account and generate client credentials in the dashboard.
 *
 *   Credentials   https://auth.reloadly.com/oauth/token  (OAuth2 client credentials)
 *   Live API      https://topups.reloadly.com
 *   Sandbox API   https://topups-sandbox.reloadly.com
 *
 * Set `RELOADLY_ENV=live` for production. Anything else uses the sandbox, which
 * issues *fake* top-ups — so it must never be the production setting.
 *
 * Data bundles are sold through the same `/topups` call using a bundle
 * operator id (see `RELOADLY_BUNDLES` in `lib/vendors/codes.ts`).
 *
 * Docs: https://github.com/Reloadly/reloadly-airtime-documentation
 */

import type { ServiceKind, VendRequest, VendResult, Vendor } from "./types";
import { reloadlyBundle, reloadlyOperatorId } from "./codes";

const AUTH_URL = "https://auth.reloadly.com/oauth/token";
const LIVE_BASE = "https://topups.reloadly.com";
const SANDBOX_BASE = "https://topups-sandbox.reloadly.com";
const ACCEPT = "application/com.reloadly.topups-v1+json";
const COVERED = ["NG", "GH", "KE", "ZA"];

export function reloadlyBaseUrl(): string {
  return process.env.RELOADLY_ENV === "live" ? LIVE_BASE : SANDBOX_BASE;
}

export function isReloadlyConfigured(): boolean {
  return Boolean(process.env.RELOADLY_CLIENT_ID && process.env.RELOADLY_CLIENT_SECRET);
}

let tokenCache: { token: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 30_000) return tokenCache.token;

  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.RELOADLY_CLIENT_ID,
      client_secret: process.env.RELOADLY_CLIENT_SECRET,
      grant_type: "client_credentials",
      audience: reloadlyBaseUrl(),
    }),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.access_token) {
    throw new Error(data?.message || data?.error || `Reloadly authentication failed (${res.status})`);
  }
  tokenCache = {
    token: String(data.access_token),
    expiresAt: now + (Number(data.expires_in) || 3600) * 1000,
  };
  return tokenCache.token;
}

/** Reloadly wants the national number without the country prefix. */
function localNumber(request: VendRequest): string {
  return request.recipient.replace(request.phonePrefix, "").replace(/\D/g, "");
}

async function detectOperatorId(request: VendRequest): Promise<number | undefined> {
  const token = await accessToken();
  const url = `${reloadlyBaseUrl()}/operators/auto-detect/phone/${encodeURIComponent(
    localNumber(request),
  )}/countries/${request.countryCode}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: ACCEPT },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return undefined;
  const id = data?.operatorId ?? data?.id;
  return typeof id === "number" ? id : undefined;
}

function pinToToken(pin: unknown): string | undefined {
  if (!pin || typeof pin !== "object") return undefined;
  const p = pin as Record<string, unknown>;
  const parts = [p.value, p.info1, p.info2, p.info3, p.serial].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  return parts.length ? parts.join(" ") : undefined;
}

async function topUp(request: VendRequest, operatorId: number, amount: number): Promise<VendResult> {
  const token = await accessToken();
  const res = await fetch(`${reloadlyBaseUrl()}/topups`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: ACCEPT,
    },
    body: JSON.stringify({
      operatorId,
      amount: amount.toFixed(2),
      useLocalAmount: true,
      customIdentifier: request.orderId,
      recipientPhone: { countryCode: request.countryCode, number: localNumber(request) },
    }),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[reloadly] top-up rejected", res.status, JSON.stringify(data));
    return { delivered: false, message: data?.message || `Reloadly error (${res.status})` };
  }

  const status = String(data?.status ?? "").toUpperCase();
  const ref = data?.transactionId != null ? String(data.transactionId) : undefined;
  // SUCCESSFUL is final. PROCESSING means Reloadly accepted the top-up and is
  // settling it; the customer's credit lands shortly, so we surface it as
  // delivered but keep the reference for support.
  const delivered = status === "SUCCESSFUL" || status === "PROCESSING";
  return {
    delivered,
    ref,
    token: pinToToken(data?.pinDetail),
    message: delivered ? undefined : `Reloadly reported "${status || "unknown"}"`,
  };
}

const reloadly: Vendor = {
  id: "reloadly",
  name: "Reloadly",
  covers(service: ServiceKind, countryCode: string): boolean {
    return (service === "airtime" || service === "data") && COVERED.includes(countryCode);
  },
  isConfigured: isReloadlyConfigured,
  async vend(request: VendRequest): Promise<VendResult> {
    if (!isReloadlyConfigured()) {
      return { delivered: false, message: "Reloadly isn't configured on this server." };
    }
    try {
      let operatorId: number | undefined;
      let amount = request.amountLocal;

      if (request.service === "data") {
        const bundle = request.bundleId ? reloadlyBundle(request.bundleId) : undefined;
        if (!bundle) {
          return {
            delivered: false,
            message: "This data bundle has no Reloadly operator mapped yet (see RELOADLY_BUNDLES).",
          };
        }
        operatorId = bundle.operatorId;
        amount = bundle.amount ?? request.amountLocal;
      } else {
        operatorId = reloadlyOperatorId(request.countryCode, request.networkId) ?? (await detectOperatorId(request));
      }

      if (!operatorId) {
        return { delivered: false, message: "Couldn't resolve the mobile operator for this number." };
      }
      return await topUp(request, operatorId, amount);
    } catch (err) {
      console.error("[reloadly] request failed", err);
      return { delivered: false, message: err instanceof Error ? err.message : "Reloadly request failed." };
    }
  },
};

export default reloadly;

/**
 * Africa's Talking — Airtime API client.
 *
 * Sandbox:   https://api.sandbox.africastalking.com/version1/airtime/send
 * Production: https://api.africastalking.com/version1/airtime/send
 *
 * Auth is the `apiKey` header plus a `username` form field ("sandbox" while testing).
 * See https://developers.africastalking.com for full docs.
 */

export interface AirtimeRecipient {
  phoneNumber: string; // international format, e.g. "+2348012345678"
  amount: string; // face value, e.g. "500"
  currencyCode: string; // e.g. "NGN"
}

export interface AirtimeResult {
  delivered: boolean;
  ref?: string;
  message?: string;
}

/**
 * Airtime needs both the API key and the app username. `AT_USERNAME=sandbox`
 * is only meaningful against the sandbox API, which `AT_ENV` selects.
 */
export function isAirtimeConfigured(): boolean {
  return Boolean(process.env.AT_API_KEY && process.env.AT_USERNAME);
}

/** Returns null when Africa's Talking is not configured (callers fall back to simulation). */
export async function sendAirtime(recipients: AirtimeRecipient[]): Promise<AirtimeResult | null> {
  if (!isAirtimeConfigured()) return null;

  const base =
    process.env.AT_ENV === "live"
      ? "https://api.africastalking.com"
      : "https://api.sandbox.africastalking.com";
  const username = process.env.AT_USERNAME || "sandbox";

  const body = new URLSearchParams({
    username,
    recipients: JSON.stringify(recipients),
  });

  const res = await fetch(`${base}/version1/airtime/send`, {
    method: "POST",
    headers: {
      apiKey: process.env.AT_API_KEY as string,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  console.log("[africastalking] response", JSON.stringify(data));
  if (!res.ok) {
    console.error("[africastalking] API error", res.status, data);
    return { delivered: false, message: data?.message || `Africa's Talking error (${res.status})` };
  }

  const responses = data?.responses;
  if (!Array.isArray(responses) || !responses.length) {
    console.error("[africastalking] no responses array in payload", data);
    return { delivered: false, message: data?.message || "Airtime API returned no delivery status." };
  }
  const response = responses[0];
  const ok = response.status === "Success";
  if (!ok) console.error("[africastalking] delivery failed", response);
  return {
    delivered: ok,
    ref: response?.requestId,
    message: ok ? undefined : response?.errorMessage || "Airtime request failed",
  };
}

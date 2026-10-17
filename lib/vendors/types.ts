/**
 * Vendor layer — one small interface every vending partner implements.
 *
 * Delivery always happens *after* the customer's USDC has settled on Arc
 * mainnet, so a vendor must never invent a result. If it can't confirm the
 * top-up it returns `delivered: false`, the order fails, and the payment is
 * reviewed for refund — the customer is never shown a fake success.
 */

export type ServiceKind = "airtime" | "data" | "electricity";

export interface VendRequest {
  orderId: string;
  service: ServiceKind;
  /** ISO-2 country code: NG | GH | KE | ZA. */
  countryCode: string;
  /** Local currency, e.g. "NGN". */
  currency: string;
  /** Catalog network / distributor id, e.g. "mtn" or "ikeja". */
  networkId: string;
  /** Recipient: international phone ("+234803…") or meter number. */
  recipient: string;
  /** Country dialing prefix, e.g. "+234". Used to derive the local number. */
  phonePrefix: string;
  /** Face value in local currency. */
  amountLocal: number;
  /** Catalog bundle id when the order is a data bundle. */
  bundleId?: string;
}

export interface VendResult {
  delivered: boolean;
  /** Vendor-side reference for support / reconciliation. */
  ref?: string;
  /** Prepaid electricity token, when the vendor issues one. */
  token?: string;
  /** Human-readable detail (shown on the receipt when not delivered). */
  message?: string;
}

export interface Vendor {
  readonly id: string;
  readonly name: string;
  /**
   * Coarse coverage, independent of credentials: could this vendor serve this
   * (service, country) at all? Credentials are checked separately so the UI can
   * tell "we have a partner but it isn't switched on" apart from "we don't
   * serve this yet".
   */
  covers(service: ServiceKind, countryCode: string): boolean;
  /** Whether every credential/config this vendor needs is present. */
  isConfigured(): boolean;
  vend(request: VendRequest): Promise<VendResult>;
}

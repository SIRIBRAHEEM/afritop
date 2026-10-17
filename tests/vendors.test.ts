import { afterEach, describe, expect, it } from "vitest";
import { buildDeliveryReport } from "@/lib/delivery";
import { canDeliver, resolveVendor, strictDelivery } from "@/lib/vendors";
import type { VendRequest } from "@/lib/vendors/types";

const MANAGED = [
  "RELOADLY_CLIENT_ID",
  "RELOADLY_CLIENT_SECRET",
  "RELOADLY_ENV",
  "VTPASS_API_KEY",
  "VTPASS_SECRET_KEY",
  "VTPASS_FALLBACK_PHONE",
  "VTPASS_SERVICE_IDS",
  "VTPASS_ENV",
  "HUBTEL_ACCOUNT_NUMBER",
  "HUBTEL_API_ID",
  "HUBTEL_API_KEY",
  "HUBTEL_ELECTRICITY_ENABLED",
  "HUBTEL_SERVICE_IDS",
  "AT_API_KEY",
  "AT_USERNAME",
  "AFRITOP_REQUIRE_REAL_DELIVERY",
];

const original = new Map(MANAGED.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const k of MANAGED) {
    const v = original.get(k);
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

function clearAll(): void {
  for (const k of MANAGED) delete process.env[k];
}

function req(over: Partial<VendRequest> = {}): VendRequest {
  return {
    orderId: "AT1",
    service: "airtime",
    countryCode: "NG",
    currency: "NGN",
    networkId: "mtn",
    recipient: "+2348031234567",
    phonePrefix: "+234",
    amountLocal: 500,
    ...over,
  };
}

describe("vendor coverage", () => {
  it("delivers nothing for real until a partner is configured", () => {
    clearAll();
    expect(canDeliver("airtime", "NG")).toBe(false);
    expect(canDeliver("data", "KE")).toBe(false);
    expect(canDeliver("electricity", "NG")).toBe(false);
  });

  it("covers airtime and data across all four countries once Reloadly is set", () => {
    clearAll();
    process.env.RELOADLY_CLIENT_ID = "id";
    process.env.RELOADLY_CLIENT_SECRET = "secret";
    for (const c of ["NG", "GH", "KE", "ZA"]) {
      expect(canDeliver("airtime", c), c).toBe(true);
      expect(canDeliver("data", c), c).toBe(true);
      expect(canDeliver("electricity", c), c).toBe(false);
    }
  });

  it("only turns on VTPass NG electricity once keys, a phone and a service id exist", () => {
    clearAll();
    process.env.VTPASS_API_KEY = "k";
    process.env.VTPASS_SECRET_KEY = "s";
    expect(canDeliver("electricity", "NG")).toBe(false);
    process.env.VTPASS_FALLBACK_PHONE = "+2348000000000";
    expect(canDeliver("electricity", "NG")).toBe(false);
    process.env.VTPASS_SERVICE_IDS = JSON.stringify({ "electricity:ikeja": "ikeja-electric" });
    expect(canDeliver("electricity", "NG")).toBe(true);
    expect(canDeliver("electricity", "GH")).toBe(false);
  });

  it("keeps Hubtel off until it is explicitly enabled", () => {
    clearAll();
    process.env.HUBTEL_ACCOUNT_NUMBER = "a";
    process.env.HUBTEL_API_ID = "i";
    process.env.HUBTEL_API_KEY = "k";
    process.env.HUBTEL_SERVICE_IDS = JSON.stringify({ "electricity:GH:ecg": "x" });
    expect(canDeliver("electricity", "GH")).toBe(false);
    process.env.HUBTEL_ELECTRICITY_ENABLED = "true";
    expect(canDeliver("electricity", "GH")).toBe(true);
  });
});

describe("vendor selection", () => {
  it("prefers Reloadly over Africa's Talking for airtime", () => {
    clearAll();
    process.env.RELOADLY_CLIENT_ID = "id";
    process.env.RELOADLY_CLIENT_SECRET = "secret";
    process.env.AT_API_KEY = "k";
    process.env.AT_USERNAME = "sandbox";
    expect(resolveVendor(req())?.id).toBe("reloadly");
  });

  it("falls back to Africa's Talking when Reloadly isn't configured", () => {
    clearAll();
    process.env.AT_API_KEY = "k";
    process.env.AT_USERNAME = "sandbox";
    expect(resolveVendor(req())?.id).toBe("africastalking");
  });

  it("returns nothing when no vendor serves the route", () => {
    clearAll();
    expect(resolveVendor(req({ service: "electricity", networkId: "kplc", countryCode: "KE" }))).toBeUndefined();
  });
});

describe("delivery report", () => {
  it("marks every route simulated when nothing is configured", () => {
    clearAll();
    const report = buildDeliveryReport();
    expect(Object.values(report.byRoute).every((v) => v === "simulated")).toBe(true);
  });

  it("marks routes live once a partner is configured", () => {
    clearAll();
    process.env.RELOADLY_CLIENT_ID = "id";
    process.env.RELOADLY_CLIENT_SECRET = "secret";
    const report = buildDeliveryReport();
    expect(report.byRoute["NG:airtime"]).toBe("live");
    expect(report.byRoute["ZA:data"]).toBe("live");
    expect(report.byRoute["NG:electricity"]).toBe("simulated");
  });
});

describe("strict delivery", () => {
  it("is off unless explicitly enabled", () => {
    clearAll();
    expect(strictDelivery()).toBe(false);
    process.env.AFRITOP_REQUIRE_REAL_DELIVERY = "true";
    expect(strictDelivery()).toBe(true);
  });
});

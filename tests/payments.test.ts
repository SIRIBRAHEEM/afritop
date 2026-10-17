import { afterEach, describe, expect, it } from "vitest";
import { paymentReceiver, paymentsEnabled } from "@/lib/chains";
import { routeStatus } from "@/lib/catalog";

const VALID = "0x1111111111111111111111111111111111111111";
const ZERO = "0x0000000000000000000000000000000000000000";
/** The address the testnet phase used as a demo receiver. */
const OLD_DEMO_BURN = "0x000000000000000000000000000000000000dEaD";

const original = process.env.USDC_RECEIVER;

afterEach(() => {
  if (original === undefined) delete process.env.USDC_RECEIVER;
  else process.env.USDC_RECEIVER = original;
});

describe("paymentReceiver", () => {
  it("returns a configured address", () => {
    process.env.USDC_RECEIVER = VALID;
    expect(paymentReceiver()).toBe(VALID);
    expect(paymentsEnabled()).toBe(true);
  });

  it("returns null when unset, so the app refuses orders instead of guessing", () => {
    delete process.env.USDC_RECEIVER;
    expect(paymentReceiver()).toBeNull();
    expect(paymentsEnabled()).toBe(false);
  });

  it("treats an empty or whitespace value as unconfigured", () => {
    for (const blank of ["", "   "]) {
      process.env.USDC_RECEIVER = blank;
      expect(paymentReceiver()).toBeNull();
    }
  });

  it("never falls back to the old demo burn address", () => {
    process.env.USDC_RECEIVER = OLD_DEMO_BURN;
    expect(paymentReceiver()).toBeNull();
    expect(paymentsEnabled()).toBe(false);
  });

  it("rejects the zero address", () => {
    process.env.USDC_RECEIVER = ZERO;
    expect(paymentReceiver()).toBeNull();
  });

  it("rejects malformed values", () => {
    const malformed = ["0xabc", "not-an-address", `0x${"z".repeat(40)}`, VALID.slice(0, -1)];
    for (const bad of malformed) {
      process.env.USDC_RECEIVER = bad;
      expect(paymentReceiver(), bad).toBeNull();
    }
  });
});

describe("delivery report", () => {
  it("treats an unknown route as simulated, so nothing is promised by accident", () => {
    expect(routeStatus({ byRoute: {} }, "electricity", "ZA")).toBe("simulated");
  });

  it("reads a route's status when present", () => {
    const report = { byRoute: { "NG:airtime": "live" as const } };
    expect(routeStatus(report, "airtime", "NG")).toBe("live");
    expect(routeStatus(report, "airtime", "GH")).toBe("simulated");
  });
});

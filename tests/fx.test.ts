import { describe, expect, it } from "vitest";
import { FX_SPREAD, effectiveRate, platformFee, toUsd } from "@/lib/fx";

/** Roughly the mid-market rates the live feed returns. */
const RATES = { NGN: 1480, GHS: 15.2, KES: 128, ZAR: 17.6 };

describe("toUsd", () => {
  it("charges above mid-market, so the spread lands on our side", () => {
    // ₦148,000 is $100 at mid-market. We must charge more than that or every
    // sale loses money the moment we convert USD back into naira.
    const usd = toUsd(148_000, "NGN", RATES);
    expect(usd).not.toBeNull();
    expect(usd as number).toBeGreaterThan(100);
    // ₦148,000 / (1480 / 1.02) = exactly $102.
    expect(usd as number).toBeCloseTo(102, 1);
  });

  it("refuses to price a currency with no rate", () => {
    expect(toUsd(1000, "XYZ", RATES)).toBeNull();
  });

  it("refuses non-positive and non-finite rates instead of guessing", () => {
    expect(toUsd(1000, "NGN", { NGN: 0 })).toBeNull();
    expect(toUsd(1000, "NGN", { NGN: -1480 })).toBeNull();
    expect(toUsd(1000, "NGN", { NGN: Number.NaN })).toBeNull();
    expect(toUsd(1000, "NGN", { NGN: Number.POSITIVE_INFINITY })).toBeNull();
  });

  it("refuses a non-finite amount", () => {
    expect(toUsd(Number.NaN, "NGN", RATES)).toBeNull();
  });
});

describe("effectiveRate", () => {
  it("is the mid-market rate divided by one plus the spread", () => {
    expect(effectiveRate(1000)).toBeCloseTo(1000 / (1 + FX_SPREAD), 10);
  });
});

describe("platformFee", () => {
  it("is 1.5% of the USD subtotal", () => {
    expect(platformFee(100)).toBe(1.5);
  });

  it("has a $0.05 floor", () => {
    expect(platformFee(0.5)).toBe(0.05);
    expect(platformFee(0)).toBe(0.05);
  });
});

import { describe, expect, it } from "vitest";
import { parseUnits } from "viem";
import { ARC_SYSTEM_EMITTER, ARC_USDC } from "@/lib/chains";
import { TRANSFER_TOPIC, selectUsdcTransferLog } from "@/lib/usdc-verify";

const FROM = "0x1111111111111111111111111111111111111111";
const TO = "0x2222222222222222222222222222222222222222";
const OTHER_CONTRACT = "0x9999999999999999999999999999999999999999";

/** `address` left-padded into a 32-byte topic, the way an ERC-20 log encodes it. */
function addrTopic(address: string): string {
  return `0x${"0".repeat(24)}${address.slice(2).toLowerCase()}`;
}

function transferLog(address: string, value: bigint, to = TO) {
  return {
    address,
    topics: [TRANSFER_TOPIC, addrTopic(FROM), addrTopic(to)],
    data: `0x${value.toString(16).padStart(64, "0")}`,
  };
}

/**
 * What Arc returns for a single ERC-20 `transfer()`: the EIP-7708 system
 * emitter's 18-decimal log first, then the ERC-20 contract's 6-decimal log for
 * the same movement, sharing topic0.
 */
function arcDualLogReceipt() {
  return [
    transferLog(ARC_SYSTEM_EMITTER, parseUnits("1", 18)),
    transferLog(ARC_USDC, parseUnits("1", 6)),
  ];
}

describe("selectUsdcTransferLog", () => {
  it("selects the 6-decimal ERC-20 log, not the 18-decimal system log", () => {
    const picked = selectUsdcTransferLog(arcDualLogReceipt(), ARC_USDC);
    expect(picked).toBeDefined();
    expect(picked?.address).toBe(ARC_USDC);
    // 1.000000 USDC — not 10^12 times that.
    expect(BigInt(picked?.data ?? "0x0")).toBe(parseUnits("1", 6));
  });

  it("is not fooled when the system emitter logs alone", () => {
    const logs = [transferLog(ARC_SYSTEM_EMITTER, parseUnits("1", 18))];
    expect(selectUsdcTransferLog(logs, ARC_USDC)).toBeUndefined();
  });

  it("ignores logs from any other contract", () => {
    const logs = [transferLog(OTHER_CONTRACT, parseUnits("1", 6))];
    expect(selectUsdcTransferLog(logs, ARC_USDC)).toBeUndefined();
  });

  it("matches the emitter address case-insensitively", () => {
    // ARC_SYSTEM_EMITTER is mixed-case, so a lowercased log address must match.
    const logs = [transferLog(ARC_SYSTEM_EMITTER.toLowerCase(), parseUnits("1", 18))];
    expect(selectUsdcTransferLog(logs, ARC_SYSTEM_EMITTER)).toBeDefined();
  });

  it("returns undefined for an empty receipt", () => {
    const noLogs: ReturnType<typeof transferLog>[] = [];
    expect(selectUsdcTransferLog(noLogs, ARC_USDC)).toBeUndefined();
  });

  it("does not confuse a different event with the same emitter", () => {
    const logs = [{ ...transferLog(ARC_USDC, parseUnits("1", 6)), topics: ["0xdeadbeef"] }];
    expect(selectUsdcTransferLog(logs, ARC_USDC)).toBeUndefined();
  });
});

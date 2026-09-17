import {
  createPublicClient,
  http,
  hexToBigInt,
  parseUnits,
  type Hash,
  type Log,
} from "viem";
import { ARC_SYSTEM_EMITTER, type UsdcChain } from "@/lib/chains";

// keccak256("Transfer(address,address,uint256)")
export const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

/** The minimum shape of a receipt log we care about. */
export interface TransferLogLike {
  address: string;
  topics: readonly (string | undefined)[];
  data?: string;
}

/**
 * Picks the *ERC-20* USDC `Transfer` log out of a receipt.
 *
 * Matching the emitter address (not just topic0) is the whole point: on Arc a
 * single `transfer()` emits the 6-decimal ERC-20 log AND an 18-decimal EIP-7708
 * log from the system emitter, sharing the same topic0. Picking the wrong one
 * reads the amount 10^12 times too large.
 *
 * Pure and exported so it can be tested without touching a network.
 */
export function selectUsdcTransferLog<T extends TransferLogLike>(
  logs: readonly T[],
  usdcAddress: string,
): T | undefined {
  const target = usdcAddress.toLowerCase();
  return logs.find(
    (l) => l.address.toLowerCase() === target && l.topics[0]?.toLowerCase() === TRANSFER_TOPIC,
  );
}

export interface VerifyResult {
  ok: boolean;
  reason?: string;
  value?: bigint;
  from?: string;
  to?: string;
}

function addrFromTopic(topic: string | undefined): string {
  if (!topic || topic.length < 42) return "";
  return `0x${topic.slice(26).toLowerCase()}`;
}

/**
 * Verifies that a USDC transfer happened on-chain:
 *  - transaction succeeded
 *  - a Transfer log exists on the USDC contract for this chain
 *  - the recipient matches `expectedTo`
 *  - the transferred value is >= `expectedAmount` (USD, converted to 6-decimals)
 *  - (optional) the sender matches `sender`
 *
 * Arc emits TWO `Transfer` logs per ERC-20 `transfer()`: the contract's own
 * 6-decimal log from the USDC address, and an EIP-7708 18-decimal log from the
 * system emitter (`ARC_SYSTEM_EMITTER`). We match on the emitter address, not
 * just the topic, so the 18-decimal value can never be read as a 6-decimal
 * amount — the two differ by 10^12.
 */
export async function verifyUsdcPayment(opts: {
  chain: UsdcChain;
  txHash: string;
  expectedTo: string;
  expectedAmountUsd: string;
  sender?: string;
  attempts?: number;
}): Promise<VerifyResult> {
  const rpcs = opts.chain.chain.rpcUrls.public.http;
  const attempts = opts.attempts ?? 4;
  // Distinguishes "broadcast but not visible yet" (indexing lag) from "we never
  // saw it at all", which is what a fee-below-floor drop looks like.
  let txSeen = false;

  for (const rpc of rpcs) {
    for (let i = 0; i < attempts; i++) {
      try {
        const publicClient = createPublicClient({
          chain: opts.chain.chain,
          transport: http(rpc, { retryCount: 1 }),
        });
        const receipt = await publicClient.getTransactionReceipt({ hash: opts.txHash as Hash });
        txSeen = true;

        if (receipt.status !== "success") {
          return { ok: false, reason: "The transaction failed on-chain." };
        }

        const log = selectUsdcTransferLog(receipt.logs, opts.chain.usdc);
        if (!log) {
          return { ok: false, reason: "No USDC transfer found in that transaction." };
        }

        // Guard against a misconfigured `usdc` address pointing at Arc's system
        // emitter, whose logs are 18-decimal.
        if (opts.chain.usdc.toLowerCase() === ARC_SYSTEM_EMITTER.toLowerCase()) {
          return {
            ok: false,
            reason: "Misconfigured USDC address: that is Arc's 18-decimal system emitter.",
          };
        }

        const to = addrFromTopic(log.topics[2]);
        const from = addrFromTopic(log.topics[1]);
        const value = hexToBigInt(log.data);
        const expected = parseUnits(opts.expectedAmountUsd, 6);

        if (to !== opts.expectedTo.toLowerCase()) {
          return { ok: false, reason: "The payment went to the wrong address." };
        }
        if (value < expected) {
          return { ok: false, reason: "The transferred amount is below the order total." };
        }
        if (opts.sender && from !== opts.sender.toLowerCase()) {
          return { ok: false, reason: "The transaction sender doesn't match the connected wallet." };
        }

        return { ok: true, value, from, to };
      } catch {
        // Transaction not indexed yet — wait briefly and retry. Arc finalizes
        // in under a second, but public RPCs can lag a moment on indexing.
        await new Promise((r) => setTimeout(r, 350));
      }
    }
  }

  return {
    ok: false,
    reason: txSeen
      ? `Couldn't confirm the transaction on ${opts.chain.label}. It may still be settling. Wait a moment and try again.`
      : `Couldn't find that transaction on ${opts.chain.label}. It may not have been included — Arc's mempool drops any transaction whose maxFeePerGas is below 20 Gwei, and a dropped transaction never appears on-chain. Check the explorer; if it isn't there, raise the fee in your wallet and pay again.`,
  };
}

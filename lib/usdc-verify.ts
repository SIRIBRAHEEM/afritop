import {
  createPublicClient,
  http,
  hexToBigInt,
  parseUnits,
  type Hash,
  type Log,
} from "viem";
import type { UsdcChain } from "@/lib/chains";

// keccak256("Transfer(address,address,uint256)")
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

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
  const attempts = opts.attempts ?? 3;

  for (const rpc of rpcs) {
    for (let i = 0; i < attempts; i++) {
      try {
        const publicClient = createPublicClient({
          chain: opts.chain.chain,
          transport: http(rpc, { retryCount: 1 }),
        });
        const receipt = await publicClient.getTransactionReceipt({ hash: opts.txHash as Hash });

        if (receipt.status !== "success") {
          return { ok: false, reason: "The transaction failed on-chain." };
        }

        const log = receipt.logs.find(
          (l: Log) =>
            l.address.toLowerCase() === opts.chain.usdc.toLowerCase() &&
            l.topics[0]?.toLowerCase() === TRANSFER_TOPIC,
        );
        if (!log) {
          return { ok: false, reason: "No USDC transfer found in that transaction." };
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
        // in under a second, so a short backoff is enough.
        await new Promise((r) => setTimeout(r, 250));
      }
    }
  }

  return {
    ok: false,
    reason: `Couldn't confirm the transaction on ${opts.chain.label}. It may still be settling — wait a moment and try again.`,
  };
}

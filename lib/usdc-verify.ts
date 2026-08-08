import {
  createPublicClient,
  http,
  hexToBigInt,
  parseAbiItem,
  parseUnits,
  type Hash,
  type Log,
} from "viem";
import type { UsdcChain } from "@/lib/chains";

// keccak256("Transfer(address,address,uint256)")
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const TRANSFER_EVENT = parseAbiItem(
  "event Transfer(address indexed from, address indexed to, uint256 value)",
);

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
  const attempts = opts.attempts ?? 4;

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
        // in under a second, but public RPCs can lag a moment on indexing.
        await new Promise((r) => setTimeout(r, 350));
      }
    }
  }

  return {
    ok: false,
    reason: `Couldn't confirm the transaction on ${opts.chain.label}. It may still be settling. Wait a moment and try again.`,
  };
}

/**
 * Scans recent USDC Transfer logs to `to` and returns the newest transfer that
 * sent at least `expectedAmountUsd` and isn't in `excludeTxHashes`.
 *
 * Used for QR / copy-address payments, where the tx hash isn't known in
 * advance: the user sends USDC from any wallet (even a phone wallet app) and
 * we watch the receiver address until the payment lands.
 */
export async function scanUsdcTransfer(opts: {
  chain: UsdcChain;
  to: string;
  expectedAmountUsd: string;
  excludeTxHashes?: string[];
  blocksBack?: number;
  /** Order creation time (epoch ms) — only transfers after this count. */
  since?: number;
}): Promise<{ txHash: Hash; from: string; value: bigint } | null> {
  const rpcs = opts.chain.chain.rpcUrls.public.http;
  // Never match transfers that predate the order: the receiver is a shared
  // address, and an old unrelated payment to it must not settle a new order.
  // Arc blocks in under a second, so the window is sized from the order's age
  // (~2 blocks/sec) with a comfortable margin, then wider fallbacks if the
  // RPC rejects the range.
  const elapsedSec = opts.since ? Math.max(0, (Date.now() - opts.since) / 1000) : 0;
  // Floor of 50k blocks (~last few hours on Arc) so a slow payer is never
  // missed, while still excluding transfers that predate the order entirely.
  const timeBased = Math.max(50_000, Math.min(600_000, Math.ceil(elapsedSec * 2) + 5_000));
  const windows = [timeBased, opts.blocksBack ?? 200_000, 20_000];
  const excluded = new Set((opts.excludeTxHashes ?? []).map((h) => h.toLowerCase()));
  const expected = parseUnits(opts.expectedAmountUsd, 6);
  const to = opts.to.toLowerCase() as `0x${string}`;

  for (const rpc of rpcs) {
    try {
      const publicClient = createPublicClient({
        chain: opts.chain.chain,
        transport: http(rpc, { retryCount: 1 }),
      });
      const latest = await publicClient.getBlockNumber();

      for (const blocksBack of windows) {
        try {
          const fromBlock = latest - BigInt(blocksBack);
          const logs = await publicClient.getLogs({
            address: opts.chain.usdc,
            event: TRANSFER_EVENT,
            args: { to },
            fromBlock,
            toBlock: "latest",
          });

          // Newest first, so a payment that just landed wins over older ones.
          const candidates = logs
            .filter((l) => !excluded.has(l.transactionHash.toLowerCase()))
            .sort((a, b) => Number(b.blockNumber! - a.blockNumber!));

          for (const log of candidates) {
            if (hexToBigInt(log.data) >= expected) {
              return {
                txHash: log.transactionHash,
                from: addrFromTopic(log.topics[1]),
                value: hexToBigInt(log.data),
              };
            }
          }
          return null;
        } catch {
          // Range rejected — retry with the narrower window.
        }
      }
    } catch {
      // Try the next RPC. No match isn't an error — the payment just isn't there yet.
    }
  }
  return null;
}

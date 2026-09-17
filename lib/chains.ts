import { defineChain, type Chain } from "viem";

export interface UsdcChain {
  id: string;
  chain: Chain;
  label: string;
  short: string;
  usdc: `0x${string}`; // USDC ERC-20 (6 decimals)
  explorer: string; // block explorer base URL
  explorerTx: (hash: string) => string;
  blurb: string;
}

/**
 * Arc — Circle's EVM Layer-1 purpose-built for stablecoin payments.
 * Sub-second deterministic finality, gas paid in USDC.
 *
 * Mainnet: chain ID 5042, https://rpc.mainnet.arc.io, https://explorer.arc.io
 * See https://docs.arc.io/arc/references/connect-to-arc
 *
 * Note on decimals: Arc's native gas token is USDC with 18 decimals, while the
 * ERC-20 interface exposes the same balance at 6 decimals. `nativeCurrency` here
 * describes the *native* interface (18), which is what wallets and viem use for
 * gas/balance display. Every USDC amount we move is parsed against the ERC-20
 * interface at 6 decimals — see `sendUsdcPayment` and `verifyUsdcPayment`.
 */
export const arc = defineChain({
  id: 5042,
  name: "Arc",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.mainnet.arc.io"] },
    public: {
      http: ["https://rpc.mainnet.arc.io", "https://rpc.drpc.mainnet.arc.io"],
    },
  },
  blockExplorers: { default: { name: "ArcScan", url: "https://explorer.arc.io" } },
  testnet: false,
});

/**
 * Arc's ERC-20 USDC interface. Identical on mainnet and testnet, 6 decimals.
 * An ERC-20 `transfer()` moves the *same* balance the native interface shows.
 */
export const ARC_USDC = "0x3600000000000000000000000000000000000000" as const;

/**
 * Arc's EIP-7708 system emitter. Every native USDC movement — including one
 * performed through the ERC-20 interface — also emits an 18-decimal `Transfer`
 * log from this address. Because a single `transfer()` produces two logs with
 * the same topic0, verification MUST match on the emitter address rather than
 * the topic alone, or the 18-decimal value gets misread as a 6-decimal amount
 * (off by 10^12). See https://docs.arc.io/arc/references/usdc-system-events
 */
export const ARC_SYSTEM_EMITTER = "0xffffFFFfFFffffffffffffffFfFFFfffFFFfFFfE" as const;

/**
 * Arc mainnet is the only payment network. The testnet phase is over: Arc
 * mainnet shipped (chain 5042), and carrying a testnet option into a
 * real-money deployment only invites mistakes.
 */
export const USDC_CHAINS: UsdcChain[] = [
  {
    id: "arc",
    chain: arc,
    label: "Arc",
    short: "ARC",
    usdc: ARC_USDC,
    explorer: "https://explorer.arc.io",
    explorerTx: (h) => `https://explorer.arc.io/tx/${h}`,
    blurb: "Circle's stablecoin L1 · gas in USDC",
  },
];

export function getUsdcChain(chainId: number): UsdcChain | undefined {
  return USDC_CHAINS.find((c) => c.chain.id === chainId);
}

export function explorerTxUrl(hash: string): string {
  return USDC_CHAINS[0].explorerTx(hash);
}

/* ── Payment destination (fail closed) ────────────────────────────
 *
 * There is deliberately no fallback address. During the testnet phase an
 * unset `USDC_RECEIVER` meant "demo mode, payments go to a burn address",
 * which was harmless with play money. On mainnet that same fallback would
 * destroy real USDC, so an unconfigured deployment disables payments
 * entirely instead of quietly sending funds nowhere.
 * ──────────────────────────────────────────────────────────────── */

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const BURN_ADDRESS = "0x000000000000000000000000000000000000dEaD";

/**
 * The address that receives USDC, or `null` when payments aren't configured
 * (missing / malformed / obviously-unspendable `USDC_RECEIVER`).
 *
 * Callers must treat `null` as "refuse the order", never as a default.
 */
export function paymentReceiver(): `0x${string}` | null {
  const env = process.env.USDC_RECEIVER?.trim();
  if (!env || !/^0x[a-fA-F0-9]{40}$/.test(env)) return null;
  const lower = env.toLowerCase();
  if (lower === ZERO_ADDRESS || lower === BURN_ADDRESS.toLowerCase()) return null;
  return env as `0x${string}`;
}

/**
 * Whether this deployment can accept real payments. Server-side only — it
 * reads `process.env`, so pass the result down as a prop rather than calling
 * it from a client component.
 */
export function paymentsEnabled(): boolean {
  return paymentReceiver() !== null;
}

/** Minimal ERC-20 transfer ABI — all we need to move USDC. */
export const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

import { defineChain, getAddress, keccak256, toBytes, type Chain } from "viem";

export interface UsdcChain {
  id: string;
  chain: Chain;
  label: string;
  short: string;
  usdc: `0x${string}`; // USDC ERC-20 (6 decimals)
  explorerTx: (hash: string) => string;
  testnet: boolean;
  blurb: string;
  faucetUrl?: string;
}

/**
 * Arc — Circle's EVM Layer-1 purpose-built for stablecoin payments.
 * Sub-second finality, gas paid in USDC. USDC uses a 6-decimal ERC-20
 * interface wrapper (0x3600…). Mainnet not yet live — testnet only for now.
 */
export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
  rpcUrls: {
    default: { http: ["https://rpc.testnet.arc.io"] },
    public: { http: ["https://rpc.testnet.arc.io", "https://rpc.drpc.testnet.arc.io"] },
  },
  blockExplorers: { default: { name: "ArcScan", url: "https://testnet.arcscan.app" } },
  testnet: true,
});

/**
 * Testnet-only phase: Arc mainnet isn't live yet, so we only accept payments
 * on Arc Testnet. Base / Polygon / Ethereum / Arbitrum (mainnet) entries were
 * removed — re-add them from git history once Arc mainnet ships.
 */
export const USDC_CHAINS: UsdcChain[] = [
  {
    id: "arc",
    chain: arcTestnet,
    label: "Arc",
    short: "ARC",
    usdc: "0x3600000000000000000000000000000000000000",
    explorerTx: (h) => `https://testnet.arcscan.app/tx/${h}`,
    testnet: true,
    blurb: "Circle's stablecoin L1 · gas in USDC",
    faucetUrl: "https://faucet.circle.com",
  },
];

export function getUsdcChain(chainId: number): UsdcChain | undefined {
  return USDC_CHAINS.find((c) => c.chain.id === chainId);
}

/** Burn address used as the receiver while in demo mode (no USDC_RECEIVER set). */
export const DEMO_RECEIVER = "0x000000000000000000000000000000000000dEaD" as const;

export function paymentReceiver(): `0x${string}` {
  const env = process.env.USDC_RECEIVER;
  if (env && /^0x[a-fA-F0-9]{40}$/.test(env)) return env as `0x${string}`;
  return DEMO_RECEIVER;
}

export function receiverIsDemo(): boolean {
  return !process.env.USDC_RECEIVER;
}

/**
 * Unique, deterministic deposit address for a QR / copy-address order.
 *
 * QR orders no longer share one receiver: with a shared address, ANY recent
 * transfer to it (from an earlier test, another tester, a faucet sweep…) can
 * match by amount and auto-deliver an order the user never paid. Deriving a
 * fresh address per order means only a payment to THIS order's address can
 * complete it — zero ambiguity.
 *
 * The address is derived from the order id (keccak truncated to 20 bytes), so
 * it's stable across serverless instances. In this testnet phase the funds sit
 * at the derived address; a production HD wallet (seed env var + sweep) slots
 * into this function later without changing the flow.
 */
export function depositAddressFor(orderId: string): `0x${string}` {
  const hash = keccak256(toBytes(`afritop:v1:${orderId}`));
  // Checksummed so it displays consistently in wallets and explorers.
  return getAddress(`0x${hash.slice(2, 42)}`);
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

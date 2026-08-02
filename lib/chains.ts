import { defineChain, type Chain } from "viem";

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
    public: { http: ["https://rpc.testnet.arc.io"] },
  },
  blockExplorers: { default: { name: "ArcScan", url: "https://testnet.arcscan.app" } },
  testnet: true,
});

const base = defineChain({
  id: 8453,
  name: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://mainnet.base.org"] },
    public: { http: ["https://mainnet.base.org", "https://base-rpc.publicnode.com"] },
  },
  blockExplorers: { default: { name: "Basescan", url: "https://basescan.org" } },
});

const polygon = defineChain({
  id: 137,
  name: "Polygon",
  nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://polygon-rpc.com"] },
    public: { http: ["https://polygon-rpc.com", "https://polygon-bor-rpc.publicnode.com"] },
  },
  blockExplorers: { default: { name: "Polygonscan", url: "https://polygonscan.com" } },
});

const ethereum = defineChain({
  id: 1,
  name: "Ethereum",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://ethereum-rpc.publicnode.com"] },
    public: { http: ["https://ethereum-rpc.publicnode.com", "https://cloudflare-eth.com"] },
  },
  blockExplorers: { default: { name: "Etherscan", url: "https://etherscan.io" } },
});

const arbitrum = defineChain({
  id: 42161,
  name: "Arbitrum One",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://arb1.arbitrum.io/rpc"] },
    public: { http: ["https://arb1.arbitrum.io/rpc", "https://arbitrum-mainnet.public.blastapi.io"] },
  },
  blockExplorers: { default: { name: "Arbiscan", url: "https://arbiscan.io" } },
});

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
  {
    id: "base",
    chain: base,
    label: "Base",
    short: "BASE",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    explorerTx: (h) => `https://basescan.org/tx/${h}`,
    testnet: false,
    blurb: "Cheap L2 · Coinbase",
  },
  {
    id: "polygon",
    chain: polygon,
    label: "Polygon",
    short: "POL",
    usdc: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    explorerTx: (h) => `https://polygonscan.com/tx/${h}`,
    testnet: false,
    blurb: "Low fees · PoS",
  },
  {
    id: "ethereum",
    chain: ethereum,
    label: "Ethereum",
    short: "ETH",
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    explorerTx: (h) => `https://etherscan.io/tx/${h}`,
    testnet: false,
    blurb: "The original chain",
  },
  {
    id: "arbitrum",
    chain: arbitrum,
    label: "Arbitrum",
    short: "ARB",
    usdc: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    explorerTx: (h) => `https://arbiscan.io/tx/${h}`,
    testnet: false,
    blurb: "Fast L2 · low fees",
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

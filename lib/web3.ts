import {
  createPublicClient,
  createWalletClient,
  custom,
  getAddress,
  http,
  parseUnits,
  type Chain,
  type EIP1193Provider,
} from "viem";
import { ERC20_TRANSFER_ABI } from "@/lib/chains";

/**
 * Shared wallet-connection helpers.
 *
 * - EIP-6963 multi-injected-provider discovery: instead of relying on the
 *   single (racy) `window.ethereum` global, wallets announce themselves via
 *   `eip6963:announceProvider` events so every installed extension is usable.
 * - Connect / switch-chain / send-USDC primitives used by the instant
 *   pay flow on /buy and by the manual flow on /pay.
 */

export interface ProviderInfo {
  uuid: string;
  name: string;
  icon?: string; // data URI
  rdns?: string;
}

export interface DetectedWallet extends ProviderInfo {
  provider: EIP1193Provider;
}

export interface WalletConnection {
  address: `0x${string}`;
  chainId: number;
  provider: EIP1193Provider;
}

export const WALLET_INSTALLS = [
  { name: "MetaMask", icon: "🦊", url: "https://metamask.io/download/" },
  { name: "Coinbase Wallet", icon: "🔵", url: "https://www.coinbase.com/wallet" },
  { name: "Trust Wallet", icon: "🔷", url: "https://trustwallet.com/download" },
  { name: "Rabby", icon: "🐰", url: "https://rabby.io" },
] as const;

/* ── EIP-6963 discovery ─────────────────────────────────────── */

let detected: DetectedWallet[] = [];
let subscribed: Array<() => void> = [];
let discoveryStarted = false;

function notify(): void {
  subscribed.forEach((cb) => cb());
}

function startDiscovery(): void {
  if (discoveryStarted || typeof window === "undefined") return;
  discoveryStarted = true;
  const onAnnounce = (event: Event) => {
    const detail = (event as CustomEvent<{ info: ProviderInfo; provider: EIP1193Provider }>).detail;
    if (!detail?.info || !detail?.provider) return;
    if (!detected.some((w) => w.uuid === detail.info.uuid)) {
      detected = [...detected, { ...detail.info, provider: detail.provider }];
      notify();
    }
  };
  window.addEventListener("eip6963:announceProvider", onAnnounce);
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

/** Subscribe to injected-wallet discovery changes (EIP-6963). Returns an unsubscribe fn. */
export function onWalletsChange(cb: () => void): () => void {
  subscribed.push(cb);
  startDiscovery();
  return () => {
    subscribed = subscribed.filter((l) => l !== cb);
  };
}

export function getDetectedWallets(): DetectedWallet[] {
  return detected;
}

/** Legacy fallback — the wallet that claimed `window.ethereum`. */
export function getInjectedProvider(): EIP1193Provider | null {
  if (typeof window === "undefined") return null;
  return (window as { ethereum?: EIP1193Provider }).ethereum ?? null;
}

/* ── Connection primitives ───────────────────────────────────── */

/** Ask the wallet to reveal accounts (this is what pops the wallet UI). */
export async function connectWith(provider: EIP1193Provider): Promise<WalletConnection> {
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts?.length) throw new Error("No accounts returned by the wallet.");
  const address = getAddress(accounts[0]);
  const chainId = Number(await provider.request({ method: "eth_chainId" }));
  return { address, chainId, provider };
}

/** Switch the wallet to `chain`; adds it first when the wallet doesn't know it (4902). */
export async function ensureChain(provider: EIP1193Provider, chain: Chain): Promise<void> {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${chain.id.toString(16)}` }],
    });
  } catch (err) {
    const e = err as { code?: number };
    if (e?.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${chain.id.toString(16)}`,
            chainName: chain.name,
            nativeCurrency: chain.nativeCurrency,
            rpcUrls: [...(chain.rpcUrls.default?.http ?? [])],
            blockExplorerUrls: chain.blockExplorers ? [chain.blockExplorers.default.url] : [],
          },
        ],
      });
    } else {
      throw err;
    }
  }
}

/** Send the exact USDC amount to `to` and wait for the on-chain receipt. */
export async function sendUsdcPayment(opts: {
  provider: EIP1193Provider;
  chain: Chain;
  token: `0x${string}`;
  to: `0x${string}`;
  amountUsd: number;
  address: `0x${string}`;
}): Promise<{ txHash: `0x${string}` }> {
  const walletClient = createWalletClient({ chain: opts.chain, transport: custom(opts.provider) });
  const hash = await walletClient.writeContract({
    address: opts.token,
    abi: ERC20_TRANSFER_ABI,
    functionName: "transfer",
    args: [opts.to, parseUnits(opts.amountUsd.toFixed(2), 6)],
    account: opts.address,
  });

  const publicClient = createPublicClient({
    chain: opts.chain,
    transport: http(opts.chain.rpcUrls.public.http[0]),
  });
  await publicClient.waitForTransactionReceipt({ hash });
  return { txHash: hash };
}

export function humanizeWalletError(err: unknown): string {
  const e = err as { code?: number; message?: string; shortMessage?: string };
  if (e?.code === 4001) return "You rejected the request in your wallet.";
  if (e?.code === 4902) return "This network isn't in your wallet yet.";
  const msg = e?.message ?? "";
  if (/insufficient funds|insufficient balance/i.test(msg)) {
    return "Your wallet doesn't have enough USDC (plus gas) to cover this payment.";
  }
  if (err instanceof TypeError || /failed to fetch|networkerror/i.test(msg)) {
    return "Network error. Please try again.";
  }
  if (e?.shortMessage) return e.shortMessage;
  if (msg) return msg.split("\n")[0];
  return "Something went wrong with the wallet request.";
}

import {
  createWalletClient,
  custom,
  getAddress,
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

/** Stable empty-wallet reference for server snapshots (must be cached). */
export const NO_WALLETS: DetectedWallet[] = [];

export const WALLET_INSTALLS = [
  {
    name: "MetaMask",
    color: "#F6851B",
    iconUrl: "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
    url: "https://metamask.io/download/",
  },
  {
    name: "Coinbase Wallet",
    color: "#0052FF",
    iconUrl: "https://www.google.com/s2/favicons?domain=coinbase.com&sz=128",
    url: "https://www.coinbase.com/wallet",
  },
  {
    name: "Trust Wallet",
    color: "#0500FF",
    iconUrl: "https://www.google.com/s2/favicons?domain=trustwallet.com&sz=128",
    url: "https://trustwallet.com/download",
  },
  {
    name: "Rabby",
    color: "#8697FF",
    iconUrl: "https://www.google.com/s2/favicons?domain=rabby.io&sz=128",
    url: "https://rabby.io",
  },
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
  // Hard cap so a stuck wallet can't freeze the "Connecting your wallet…" stage.
  const accounts = (await withTimeout(
    provider.request({ method: "eth_requestAccounts" }),
    60_000,
    "Your wallet is taking too long to connect. Make sure it's unlocked, then try again.",
  )) as string[];
  if (!accounts?.length) throw new Error("No accounts returned by the wallet.");
  const address = getAddress(accounts[0]);
  const chainId = Number(await provider.request({ method: "eth_chainId" }));
  return { address, chainId, provider };
}

/** Switch the wallet to `chain`; adds it first when the wallet doesn't know it (4902). */
export async function ensureChain(provider: EIP1193Provider, chain: Chain): Promise<void> {
  try {
    await withTimeout(
      provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chain.id.toString(16)}` }],
      }),
      45_000,
      "Your wallet is taking too long to switch to Arc Testnet. Try again.",
    );
  } catch (err) {
    const e = err as { code?: number };
    if (e?.code === 4902) {
      await withTimeout(
        provider.request({
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
        }),
        45_000,
        "Your wallet is taking too long to add Arc Testnet. Try again.",
      );
    } else {
      throw err;
    }
  }
}

/**
 * Reject `p` if it hasn't settled within `ms` — the UI must never hang forever
 * waiting on an external party (e.g. a wallet that can't reach its RPC).
 */
export function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

/**
 * Send the exact USDC amount to `to` and broadcast the transaction.
 *
 * Only the wallet popup is awaited here, with a hard cap so a stuck wallet
 * (e.g. one whose configured Arc RPC is unreachable) can never leave the UI
 * frozen on "Sending USDC…". We deliberately do NOT wait for the on-chain
 * receipt client-side: the browser's link to a public RPC is the most
 * failure-prone hop in the flow (CORS, rate limits, flaky endpoints), and
 * viem's default wait is 180 seconds. Instead, the server verifies the
 * transfer on-chain via /api/confirm-usdc with multi-RPC failover.
 */
export async function sendUsdcPayment(opts: {
  provider: EIP1193Provider;
  chain: Chain;
  token: `0x${string}`;
  to: `0x${string}`;
  amountUsd: number;
  address: `0x${string}`;
}): Promise<{ txHash: `0x${string}` }> {
  const walletClient = createWalletClient({ chain: opts.chain, transport: custom(opts.provider) });
  const hash = await withTimeout(
    walletClient.writeContract({
      address: opts.token,
      abi: ERC20_TRANSFER_ABI,
      functionName: "transfer",
      args: [opts.to, parseUnits(opts.amountUsd.toFixed(2), 6)],
      account: opts.address,
    }),
    60_000,
    "Your wallet is taking too long to send the payment. If you already approved it, check testnet.arcscan.app before trying again.",
  );
  return { txHash: hash };
}

/** Error text the server returns when the tx exists but hasn't surfaced yet. */
const TRANSIENT_CONFIRM_RE = /still settling|not indexed|wait a moment/i;

/**
 * POST /api/confirm-usdc — server-side on-chain verification + fulfillment.
 * Retries a few times on transient "still settling" errors, so a slow public
 * RPC on Arc doesn't fail a payment that the wallet already broadcast.
 */
export async function confirmUsdcPayment(opts: {
  orderId: string;
  txHash: string;
  chainId: number;
  sender: string;
  attempts?: number;
  /** Client journal entry — lets the server rebuild the order if its ephemeral store lost it. */
  order?: unknown;
}): Promise<
  | { ok: true; token?: string; message?: string }
  | { ok: false; error: string; retryable: boolean }
> {
  const attempts = opts.attempts ?? 3;
  let lastError = "The payment couldn't be confirmed yet.";
  let retryable = false;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch("/api/confirm-usdc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: opts.orderId,
          txHash: opts.txHash,
          chainId: opts.chainId,
          sender: opts.sender,
          order: opts.order,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Surface the fulfilled order's delivery details (e.g. the electricity
        // recharge token) so the client journal can render the full receipt
        // even if the ephemeral server store is reset.
        return { ok: true, token: data?.order?.token, message: data?.order?.message };
      }
      lastError = data?.error ?? "The payment couldn't be confirmed. Please try again.";
      // Retryable = the tx was likely broadcast but hasn't surfaced on-chain yet
      // (still settling / not indexed). Anything else (failed on-chain, wrong
      // receiver, replay…) is definitive and won't fix itself.
      retryable = TRANSIENT_CONFIRM_RE.test(lastError);
      if (!retryable) return { ok: false, error: lastError, retryable: false };
    } catch {
      // Network hiccup — the payment may well have gone through; retry.
      lastError = "Network error while confirming the payment. Please try again.";
      retryable = true;
    }
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
  return { ok: false, error: lastError, retryable };
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

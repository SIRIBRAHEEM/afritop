import { createWalletClient, custom, type EIP1193Provider } from "viem";
import { buildAuthMessage } from "@/lib/auth-message";

/**
 * Client-side wallet session store.
 *
 * Reads the session from /api/auth/session once, then keeps the rest of the
 * UI (navbar, transactions page) in sync via useSyncExternalStore.
 */

export type SessionState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; address: `0x${string}` };

/** Stable module-level reference for the server snapshot (must be cached). */
export const LOADING_SESSION: SessionState = { status: "loading" };

let state: SessionState = LOADING_SESSION;
let initialized = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

export function subscribeSession(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getSessionSnapshot(): SessionState {
  return state;
}

export async function refreshSession(): Promise<void> {
  try {
    const res = await fetch("/api/auth/session");
    const data = await res.json();
    state = data?.address
      ? { status: "signedIn", address: data.address as `0x${string}` }
      : { status: "signedOut" };
  } catch {
    state = { status: "signedOut" };
  }
  emit();
}

/** Load the session once (safe to call on mount from multiple components). */
export function ensureSessionLoaded(): void {
  if (!initialized) {
    initialized = true;
    void refreshSession();
  }
}

export async function signInWithWallet(opts: {
  provider: EIP1193Provider;
  address: `0x${string}`;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    // 1. Server-issued, time-limited nonce (pins issuedAt).
    const nonceRes = await fetch("/api/auth/nonce");
    if (!nonceRes.ok) throw new Error("Couldn't start sign-in. Please try again.");
    const { token, nonce, issuedAt } = await nonceRes.json();

    // 2. Ask the wallet to sign the exact SIWE-style message.
    const walletClient = createWalletClient({ transport: custom(opts.provider) });
    const message = buildAuthMessage({
      address: opts.address,
      nonce,
      issuedAt,
      domain: window.location.host,
    });
    const signature = await walletClient.signMessage({ account: opts.address, message });

    // 3. Server verifies nonce + message + signature, then sets the session cookie.
    const res = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: opts.address, message, signature, nonceToken: token }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data?.error ?? "Sign-in failed. Please try again." };
    }
    state = { status: "signedIn", address: data.address as `0x${string}` };
    emit();
    return { ok: true };
  } catch (err) {
    const e = err as { code?: number; message?: string };
    if (e?.code === 4001) return { ok: false, error: "You rejected the sign-in in your wallet." };
    return { ok: false, error: e?.message ?? "Sign-in failed. Please try again." };
  }
}

export async function signOutSession(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Ignore — we sign out locally regardless.
  }
  state = { status: "signedOut" };
  emit();
}

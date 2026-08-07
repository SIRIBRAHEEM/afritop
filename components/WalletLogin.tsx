"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  connectWith,
  getDetectedWallets,
  getInjectedProvider,
  NO_WALLETS,
  onWalletsChange,
  type DetectedWallet,
} from "@/lib/web3";
import {
  ensureSessionLoaded,
  getSessionSnapshot,
  LOADING_SESSION,
  signInWithWallet,
  signOutSession,
  subscribeSession,
} from "@/lib/wallet-session";
import { humanizeWalletError } from "@/lib/web3";
import { cn } from "@/lib/utils";

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletLogin({ className }: { className?: string }) {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot, () => LOADING_SESSION);
  // EIP-6963 wallet discovery is external state — subscribe via the store hook.
  const wallets = useSyncExternalStore(onWalletsChange, getDetectedWallets, () => NO_WALLETS);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureSessionLoaded();
  }, []);

  const signIn = async (wallet?: DetectedWallet) => {
    setBusy(true);
    setError(null);
    try {
      const provider = wallet?.provider ?? getInjectedProvider();
      if (!provider) {
        setError("No wallet found. Install MetaMask, Coinbase, Trust or Rabby.");
        return;
      }
      const conn = await connectWith(provider);
      const res = await signInWithWallet({ provider, address: conn.address });
      if (!res.ok) setError(res.error ?? "Sign-in failed.");
      else setOpen(false);
    } catch (err) {
      setError(humanizeWalletError(err));
    } finally {
      setBusy(false);
    }
  };

  const pickable = wallets.length > 1 ? wallets : null;

  if (session.status === "signedIn") {
    return (
      <div className={cn("relative", className)}>
        {/* Compact on phones: ping + wallet icon + chevron; the address text
            only appears from 480px up so the navbar never crowds or wraps
            when a wallet is connected on a small screen. */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-2 border-2 border-ink-950 bg-brand-50 px-2.5 py-2 text-sm font-medium text-brand-700 transition-all hover:-translate-y-0.5 hover:bg-brand-100 sm:px-3.5"
        >
          <span className="relative flex size-2">
            <span className="animate-ping-slow absolute inline-flex size-2 rounded-full bg-brand-500" />
            <span className="relative inline-flex size-2 rounded-full bg-brand-500" />
          </span>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="hidden font-mono min-[480px]:inline">{shortAddress(session.address)}</span>
          <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
            <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden border-2 border-ink-950 bg-surface p-2 shadow-hard">
              <p className="px-3 py-2 font-mono text-xs text-ink-400">{session.address}</p>
              <Link
                href="/transactions"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-ink-700 transition-colors hover:bg-ink-50"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18M7 15l4-4 3 3 5-6" />
                </svg>
                My transactions
              </Link>
              <button
                type="button"
                onClick={() => void signOutSession()}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => (pickable ? setOpen((v) => !v) : void signIn())}
        disabled={busy || session.status === "loading"}
        className="btn-cta flex items-center gap-2 border-2 border-ink-950 bg-night px-3 py-2 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-ink-800 disabled:cursor-wait disabled:opacity-60 sm:px-4"
      >
        {busy ? (
          <svg viewBox="0 0 24 24" className="size-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        )}
        {busy ? "Signing in…" : "Sign in"}
      </button>

      {(open || error) && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpen(false);
              setError(null);
            }}
            aria-hidden="true"
          />
          <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden border-2 border-ink-950 bg-surface p-2 shadow-hard">
            {pickable && (
              <>
                <p className="px-3 pb-1 pt-2 text-xs font-bold uppercase tracking-wider text-ink-500">
                  Connect a wallet
                </p>
                {wallets.map((w) => (
                  <button
                    key={w.uuid}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      void signIn(w);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-ink-700 transition-colors hover:bg-ink-50"
                  >
                    {w.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={w.icon} alt="" className="size-6 object-contain" />
                    ) : (
                      <span className="grid size-6 place-items-center bg-ink-100 text-[11px] font-extrabold text-ink-700">
                        {w.name.slice(0, 2)}
                      </span>
                    )}
                    {w.name}
                  </button>
                ))}
              </>
            )}
            {error && <p className="px-3 py-2 text-xs font-semibold text-red-500">{error}</p>}
          </div>
        </>
      )}
    </div>
  );
}

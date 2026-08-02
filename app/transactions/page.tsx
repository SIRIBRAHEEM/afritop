"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import type { Order } from "@/lib/store";
import { formatLocal, formatUsd } from "@/lib/fx";
import { StatusChip } from "@/components/StatusChip";
import { BrandMark } from "@/components/BrandMark";
import { subscribeReceipts, getReceiptsSnapshot, type ReceiptEntry } from "@/lib/receipt-journal";
import { getCountry } from "@/lib/catalog";

interface TxRow {
  id: string;
  createdAt: string;
  status: Order["status"];
  service: string;
  countryCode: string;
  providerId: string;
  providerShort: string;
  providerName: string;
  recipient: string;
  bundle?: { size: string; validity: string };
  amountLocal: number;
  currency: string;
  usdTotal: number;
}

function toRow(o: Order | ReceiptEntry): TxRow {
  return {
    id: o.id,
    createdAt: o.createdAt,
    status: o.status,
    service: o.service,
    countryCode: o.countryCode,
    providerId: "provider" in o ? o.provider.id : o.providerId,
    providerShort: "provider" in o ? o.provider.short : o.providerShort,
    providerName: "provider" in o ? o.provider.name : o.providerName,
    recipient: o.recipient,
    bundle: o.bundle,
    amountLocal: o.amountLocal,
    currency: o.currency,
    usdTotal: o.usdTotal,
  };
}

/** Official brand mark lookup for a row (falls back to a neutral avatar). */
function providerMark(row: TxRow) {
  const country = getCountry(row.countryCode);
  const provider =
    country?.networks.find((p) => p.id === row.providerId) ??
    country?.distributors.find((p) => p.id === row.providerId);
  return {
    logo: provider?.logo,
    color: provider?.color ?? "#E7E5DF",
    name: provider?.name ?? row.providerName,
  };
}

export default function TransactionsPage() {
  const [serverOrders, setServerOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  // Local receipt journal — history survives even if the server store is reset.
  const journal = useSyncExternalStore(subscribeReceipts, getReceiptsSnapshot, () => null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const res = await fetch("/api/transactions");
        const data = await res.json();
        if (!ignore) {
          setServerOrders(data.orders ?? []);
          setError(null);
        }
      } catch {
        if (!ignore) setError("Couldn't load your transactions. Please refresh.");
      }
    })();
    return () => {
      ignore = true;
    };
  }, [reload]);

  // Server orders + local receipt journal (deduped, newest first) — history
  // survives even if the ephemeral server store has been reset.
  const rows = useMemo<TxRow[]>(() => {
    const server = (serverOrders ?? []).map(toRow);
    const seen = new Set(server.map((r) => r.id));
    const extra = (journal ?? []).filter((j) => !seen.has(j.id)).map(toRow);
    return [...extra, ...server].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [serverOrders, journal]);

  return (
    <div className="flex-1 bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4 animate-fade-up">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-brand-600">History</p>
            <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
              Transactions
            </h1>
            <p className="mt-2 text-ink-500">Every top-up, token and payment — in one place.</p>
          </div>
          <button
            type="button"
            onClick={() => setReload((r) => r + 1)}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-ink-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
            </svg>
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {serverOrders === null ? (
          <div className="mt-12 flex justify-center py-16">
            <svg viewBox="0 0 24 24" className="size-8 animate-spin text-brand-500" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-12 rounded-3xl bg-ink-50/50 px-6 py-20 text-center">
            <span className="text-5xl">🧾</span>
            <h2 className="mt-5 text-xl font-extrabold text-ink-900">No transactions yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
              When you buy airtime, data or electricity, your receipts will show up here.
            </p>
            <Link
              href="/buy"
              className="mt-6 inline-flex rounded-full bg-gradient-to-r from-brand-600 to-brand-700 px-7 py-3 text-sm font-extrabold text-white shadow-lg shadow-brand-600/25 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Make your first top-up
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="mt-8 hidden overflow-hidden rounded-3xl bg-white shadow-[0_30px_70px_-40px_rgba(22,20,14,0.35)] md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-ink-50/70 text-xs font-bold uppercase tracking-wider text-ink-400">
                    <th className="px-6 py-4">Order</th>
                    <th className="px-6 py-4">Service</th>
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4 text-right">Amount</th>
                    <th className="px-6 py-4 text-right">Paid (USDC)</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => {
                    const mark = providerMark(o);
                    return (
                      <tr key={o.id} className="transition-colors even:bg-ink-50/40 hover:bg-brand-50/40">
                        <td className="px-6 py-4">
                          <Link
                            href={`/success?orderId=${o.id}`}
                            className="font-mono text-xs font-bold text-brand-700 hover:underline"
                          >
                            {o.id}
                          </Link>
                          <p className="mt-0.5 text-xs text-ink-400">
                            {new Date(o.createdAt).toLocaleString()}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="capitalize font-bold text-ink-900">{o.service}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-2 font-semibold text-ink-700">
                            <BrandMark logo={mark.logo} name={mark.name} short={o.providerShort} color={mark.color} size={24} />
                            {o.providerShort}
                            <span className="font-mono text-xs text-ink-400">{o.recipient}</span>
                          </span>
                          {o.bundle && (
                            <p className="mt-0.5 text-xs text-ink-400">{o.bundle.size} · {o.bundle.validity}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-semibold text-ink-900">
                          {formatLocal(o.amountLocal, o.currency)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-semibold text-brand-700">
                          {formatUsd(o.usdTotal)}
                        </td>
                        <td className="px-6 py-4">
                          <StatusChip status={o.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="mt-6 space-y-4 md:hidden">
              {rows.map((o) => {
                const mark = providerMark(o);
                return (
                  <Link
                    key={o.id}
                    href={`/success?orderId=${o.id}`}
                    className="block rounded-3xl bg-white p-5 shadow-sm transition-all hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-brand-700">{o.id}</span>
                      <StatusChip status={o.status} />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <BrandMark logo={mark.logo} name={mark.name} short={o.providerShort} color={mark.color} size={32} />
                        <div>
                          <p className="capitalize text-sm font-extrabold text-ink-900">
                            {o.service} · {o.providerShort}
                          </p>
                          <p className="mt-0.5 font-mono text-xs text-ink-400">{o.recipient}</p>
                          {o.bundle && (
                            <p className="mt-0.5 text-xs text-ink-400">{o.bundle.size} · {o.bundle.validity}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-extrabold text-ink-900">
                          {formatLocal(o.amountLocal, o.currency)}
                        </p>
                        <p className="font-mono text-xs font-semibold text-brand-700">{formatUsd(o.usdTotal)} USDC</p>
                      </div>
                    </div>
                    <p className="mt-3 pt-2.5 text-xs text-ink-400">
                      {new Date(o.createdAt).toLocaleString()}
                    </p>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

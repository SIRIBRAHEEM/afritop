"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const FAQS = [
  {
    q: "How fast is delivery?",
    a: "Airtime credits hit the number in seconds. Electricity tokens are generated the moment your USDC payment settles on-chain — usually well under a minute.",
  },
  {
    q: "What is USDC and why do I pay with it?",
    a: "USDC is a stablecoin issued by Circle, always worth 1 US dollar. You pay straight from your own wallet — MetaMask, Coinbase, Trust or Rabby — on Arc. No bank card, no hidden exchange margins.",
  },
  {
    q: "Which countries and networks do you support?",
    a: "We currently cover Nigeria, Ghana, Kenya and South Africa — 14 mobile networks and 11 power utilities. More countries are on the way.",
  },
  {
    q: "Do I need an account?",
    a: "No. Just connect your wallet, choose a top-up and pay. Your receipts and history stay available right on your device.",
  },
  {
    q: "What if my top-up doesn't arrive?",
    a: "Every payment is confirmed on-chain, and you can re-check your receipt or start a new payment from the history page. If a transaction failed on-chain, nothing was charged and you can simply try again.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className="py-2">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className={cn(
                "flex w-full items-center justify-between gap-4 border-2 border-ink-950 bg-surface px-5 py-5 text-left transition-all duration-200 hover:-translate-y-0.5 sm:px-6",
                isOpen && "bg-brand-50",
              )}
            >
              <span className="font-display text-lg font-bold text-ink-900 sm:text-xl">{f.q}</span>
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center border-2 border-ink-950 transition-all duration-300",
                  isOpen ? "btn-cta rotate-45 bg-night text-[#e6ed0a]" : "bg-surface text-ink-950",
                )}
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-6 text-sm leading-relaxed text-ink-500 sm:px-6 sm:text-base">{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import * as React from "react";
import { CheckCheck, Headset, Loader2, Paperclip, Send, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@/components/ui/message";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import {
  Attachment,
  AttachmentAction,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";

type Role = "user" | "agent";

interface ChatMsg {
  id: string;
  role: Role;
  text: string;
  time: string;
  kind?: "text" | "receipt";
}

const QUICK_REPLIES: { label: string; reply: string }[] = [
  {
    label: "Track my top-up",
    reply:
      "You can track any top-up on the Transactions page. Share your order ID (starts with AT-) and I'll check the delivery status for you right away.",
  },
  {
    label: "Top-up not delivered",
    reply:
      "Sorry about that! Every payment is verified on-chain, and if a top-up hasn't landed within 10 minutes we retry or refund automatically. Let me know your order ID and I'll escalate it now.",
  },
  {
    label: "How do I pay with USDC?",
    reply:
      "At checkout, connect any EVM wallet (MetaMask, Coinbase, Trust or Rabby), approve the exact amount on Arc, and we confirm on-chain. No card needed — USDC is always worth $1.",
  },
  {
    label: "Supported countries",
    reply:
      "We're live in Nigeria 🇳🇬, Ghana 🇬🇭, Kenya 🇰🇪 and South Africa 🇿🇦 — 14 mobile networks and 11 power utilities. More countries are on the way!",
  },
];

const WELCOME: ChatMsg[] = [
  {
    id: "w1",
    role: "agent",
    text: "Hi there! I'm Ada, your Afritop support assistant. How can I help you today?",
    time: "Just now",
  },
  {
    id: "w2",
    role: "agent",
    text: "Here's a sample receipt so you know what a successful top-up looks like:",
    time: "Just now",
    kind: "receipt",
  },
];

function timeNow(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function AgentAvatar({ online = true }: { online?: boolean }) {
  return (
    <span className="relative grid size-8 shrink-0 place-items-center overflow-hidden border-2 border-ink-950 bg-night text-[#d4ff3f] shadow-hard-sm">
      <span className="font-display text-sm font-bold">A</span>
      {online && (
        <span className="absolute bottom-0 right-0 size-2.5 bg-[#d4ff3f] border-2 border-ink-950" />
      )}
    </span>
  );
}

export function SupportChat() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMsg[]>(WELCOME);
  const [typing, setTyping] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [unread, setUnread] = React.useState(true);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  const launcherRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    timers.current.push(t);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const launcher = launcherRef.current;
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      launcher?.focus();
    };
  }, [open]);

  React.useEffect(() => {
    const active = timers.current;
    return () => active.forEach(clearTimeout);
  }, []);

  const push = React.useCallback((msg: ChatMsg) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const agentReply = React.useCallback(
    (text: string) => {
      setTyping(true);
      const t = setTimeout(() => {
        setTyping(false);
        push({ id: `a-${Date.now()}`, role: "agent", text, time: timeNow() });
      }, 1400 + Math.random() * 900);
      timers.current.push(t);
    },
    [push]
  );

  const send = React.useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || typing) return;
      push({ id: `u-${Date.now()}`, role: "user", text, time: timeNow() });
      setDraft("");
      const quick = QUICK_REPLIES.find((q) => q.label === text);
      if (quick) {
        agentReply(quick.reply);
      } else {
        agentReply(
          "Thanks for your message! I've noted it down — an agent will follow up here shortly. Meanwhile, you can check your order on the Transactions page."
        );
      }
    },
    [push, agentReply, typing]
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) send(draft);
  };

  const latestId = messages[messages.length - 1]?.id;

  return (
    <>
      {/* ── Floating launcher ─────────────────────────────────── */}
      <div className="fixed bottom-5 right-5 z-[60] sm:bottom-6 sm:right-6">
        <button
          ref={launcherRef}
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            setUnread(false);
          }}
          aria-expanded={open}
          aria-label={open ? "Close support chat" : "Open support chat"}
          className={cn(
            "group relative grid size-14 place-items-center rounded-full text-white shadow-[0_24px_50px_-16px_rgba(43,74,47,0.55)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_-16px_rgba(43,74,47,0.6)]",
            open
              ? "bg-night rotate-90 text-[#d4ff3f]"
              : "bg-night border-2 border-ink-950 shadow-hard"
          )}
        >
          {open ? (
            <X className="size-6" />
          ) : (
            <Headset className="size-6" />
          )}

          {/* unread dot */}
          {unread && !open && (
            <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-sun-400 text-[10px] font-extrabold text-paper ring-2 ring-paper">
              1
            </span>
          )}

          {/* hover label */}
          <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap border-2 border-ink-950 bg-surface px-3.5 py-1.5 text-xs font-bold text-ink-950 opacity-0 shadow-hard-sm transition-opacity duration-200 group-hover:opacity-100 sm:block">
            Chat with us
          </span>
        </button>
      </div>

      {/* ── Chat panel ───────────────────────────────────────── */}
      <div
        className={cn(
          "fixed z-[59] flex flex-col overflow-hidden border-2 border-ink-950 bg-surface shadow-hard transition-all duration-300 ease-out",
          "inset-x-0 bottom-0 h-[82dvh] max-h-[640px] sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[600px] sm:w-[400px]",
          open
            ? "translate-y-0 opacity-100 sm:translate-y-0 sm:scale-100"
            : "pointer-events-none translate-y-8 opacity-0 sm:translate-y-4 sm:scale-[0.97]"
        )}
        role="dialog"
        aria-modal="false"
        aria-label="Afritop support chat"
        aria-hidden={!open}
        inert={!open || undefined}
      >
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden border-b-2 border-ink-950 bg-night px-5 pb-5 pt-4 text-[#d4ff3f]">
          <div className="bg-grid-dark absolute inset-0" aria-hidden="true" />
          <div className="relative flex items-center gap-3">
            <div className="relative">
              <span className="grid size-11 place-items-center border-2 border-ink-950 bg-surface shadow-hard-sm">
                <svg viewBox="0 0 24 24" className="size-5 text-ink-950" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </span>
              <span className="absolute -bottom-1 -right-1 size-3.5 bg-[#d4ff3f] border-2 border-ink-950" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-bold">Afritop Support</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#d4ff3f]/70">
                <span className="size-1.5 animate-pulse bg-[#d4ff3f]" />
                Online — replies in ~2 min
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="grid size-9 place-items-center border-2 border-ink-950 bg-surface text-ink-950 shadow-hard-sm transition-colors hover:bg-brand-50"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Conversation */}
        <MessageScrollerProvider>
          <MessageScroller className="flex-1 bg-paper border-t-2 border-ink-950">
            <MessageScrollerViewport className="px-4 pb-4 pt-5">
              <MessageScrollerContent className="gap-7">
                {messages.map((m) => {
                  const mine = m.role === "user";
                  return (
                    <MessageScrollerItem
                      key={m.id}
                      scrollAnchor={m.id === latestId}
                    >
                      <Message align={mine ? "end" : "start"}>
                        {!mine && (
                          <MessageAvatar>
                            <AgentAvatar />
                          </MessageAvatar>
                        )}
                        <MessageContent>
                          <MessageGroup className="gap-2">
                            {!mine && (
                              <MessageHeader>
                                Ada · Afritop Support
                              </MessageHeader>
                            )}
                            {m.kind === "receipt" ? (
                              <Bubble variant="secondary">
                                <BubbleContent>{m.text}</BubbleContent>
                              </Bubble>
                            ) : (
                              <Bubble variant={mine ? "default" : "secondary"}>
                                <BubbleContent>{m.text}</BubbleContent>
                              </Bubble>
                            )}
                          </MessageGroup>

                          {m.kind === "receipt" && (
                            <Attachment className="ml-9">
                              <AttachmentMedia>
                                <Paperclip className="size-4" />
                              </AttachmentMedia>
                              <AttachmentContent>
                                <AttachmentTitle>
                                  afritop-receipt-AT-K2F9MZ.pdf
                                </AttachmentTitle>
                                <AttachmentDescription>
                                  PDF · 24 KB · 12 Aug 2026
                                </AttachmentDescription>
                              </AttachmentContent>
                              <AttachmentAction
                                aria-label="Download receipt"
                                onClick={() => downloadSampleReceipt()}
                              >
                                <DownloadIcon />
                              </AttachmentAction>
                            </Attachment>
                          )}

                          <MessageFooter>
                            <span className="flex items-center gap-1">
                              {m.time}
                              {mine && (
                                <CheckCheck className="size-3.5 text-brand-500" />
                              )}
                            </span>
                          </MessageFooter>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  );
                })}

                {/* Typing indicator */}
                {typing && (
                  <MessageScrollerItem>
                    <Message align="start">
                      <MessageAvatar>
                        <AgentAvatar />
                      </MessageAvatar>
                      <MessageContent>
                        <Marker role="status">
                          <MarkerIcon>
                            <Loader2 className="animate-spin text-brand-500" />
                          </MarkerIcon>
                          <MarkerContent>Ada is typing…</MarkerContent>
                        </Marker>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                )}

                {/* Quick replies */}
                {messages.filter((m) => m.role === "user").length === 0 &&
                  !typing && (
                    <MessageScrollerItem>
                      <Message align="start">
                        <MessageAvatar>
                          <AgentAvatar />
                        </MessageAvatar>
                        <MessageContent>
                          <div className="flex flex-wrap gap-2">
                            {QUICK_REPLIES.map((q) => (
                              <button
                                key={q.label}
                                type="button"
                                onClick={() => send(q.label)}
                                className="border-2 border-ink-950 bg-surface px-3.5 py-1.5 text-xs font-bold text-ink-950 shadow-hard-sm transition-all hover:-translate-y-0.5 hover:bg-brand-50 hover:shadow-hard"
                              >
                                {q.label}
                              </button>
                            ))}
                          </div>
                          <MessageFooter>Try a quick question</MessageFooter>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton aria-label="Scroll to latest message" />
          </MessageScroller>
        </MessageScrollerProvider>

        {/* Composer */}
        <div className="shrink-0 border-t-2 border-ink-950 bg-surface px-4 py-3.5">
          <div className="flex items-center gap-2 border-2 border-ink-950 bg-surface px-3.5 py-1 shadow-hard-sm transition-colors focus-within:shadow-hard">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type your message…"
              aria-label="Message Ada"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-ink-950 outline-none placeholder:text-ink-400"
            />
            <button
              type="button"
              onClick={() => send(draft)}
              disabled={!draft.trim() || typing}
              aria-label="Send message"
              className="grid size-9 shrink-0 place-items-center border-2 border-ink-950 bg-night text-[#d4ff3f] shadow-hard-sm transition-all hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[10px] font-bold text-ink-400">
            Support hours: 24/7 · Usually replies in under 2 minutes
          </p>
        </div>
      </div>
    </>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

/** Download a tiny sample receipt so the demo attachment is real, not a no-op. */
function downloadSampleReceipt() {
  const content = [
    "AFRITOP — RECEIPT",
    "Order: AT-K2F9MZ",
    "Airtime · MTN Nigeria",
    "₦500 to +234 801 234 5678",
    "Paid: 0.37 USDC on Arc",
    "Delivered in 9 seconds",
    "Thank you for using Afritop!",
  ].join("\n");
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "afritop-receipt-AT-K2F9MZ.txt";
  a.click();
  URL.revokeObjectURL(url);
}

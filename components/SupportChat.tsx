"use client";

import * as React from "react";
import { CheckCheck, Headset, Mail, Package, Send, UserRound, X, Zap } from "lucide-react";

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
  from?: "ai" | "team";
}

const CONV_KEY = "afritop-support-conv";
const EMAIL_KEY = "afritop-support-email";

const QUICK_REPLIES = [
  { icon: Package, label: "Track my order" },
  { icon: Zap, label: "Pay with USDC" },
  { icon: UserRound, label: "Talk to a human" },
];

function convId(): string {
  try {
    let id = localStorage.getItem(CONV_KEY);
    if (!id) {
      id = `cv_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
      localStorage.setItem(CONV_KEY, id);
    }
    return id;
  } catch {
    return `cv_${Math.random().toString(36).slice(2, 10)}`;
  }
}

function timeNow(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Renders message text safely: escapes everything, then restores only the
 * <strong>/<b> emphasis tags our own auto-replies use. Owner emails pass
 * through the same path, so any injected HTML stays inert.
 */
function safeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/&lt;\/?strong&gt;/g, (m) => (m.includes("/") ? "</strong>" : "<strong>"))
    .replace(/&lt;\/?b&gt;/g, (m) => (m.includes("/") ? "</b>" : "<b>"));
}

/**
 * The built-in assistant brain — instant auto-replies. Anything that needs a
 * human ("talk to a person", a failed delivery…) is escalated by email to the
 * owner's inbox (SUPPORT_EMAIL), and their Gmail reply comes back into the chat
 * via the /api/support/inbound webhook.
 */
function autoReply(text: string, email: string): { reply: string; saveEmail?: boolean } {
  const t = text.toLowerCase();

  if (EMAIL_RE.test(text)) {
    return {
      saveEmail: true,
      reply: `Thanks — I've saved <strong>${text}</strong> for the team. They can now email you directly, and their replies will also show up right here in the chat. How else can I help?`,
    };
  }

  if (/(talk to a (person|human|real|human agent)|real person|human agent|support agent)/.test(t)) {
    return {
      reply: email
        ? `No problem — I've sent your message to our support team. They'll reply here in the chat (and to <strong>${email}</strong> by email) shortly.`
        : `No problem — I'll have our support team jump in. Could you leave your email below so they can reach you directly (and so their reply lands in this chat)?`,
    };
  }

  if (/(track|status|where is|check).{0,20}(top-?up|order|delivery)/.test(t) || /^at-[a-z0-9]+$/i.test(t)) {
    return {
      reply:
        "You can track any top-up on the Transactions page — just sign in with the wallet you paid with. If you share your order ID (it starts with AT-), I can point you to the right spot.",
    };
  }

  if (/(not (delivered|arrive|received)|didn'?t (arrive|receive)|never (got|arrived)|missing|failed|hasn'?t arrived)/.test(t)) {
    return {
      reply: email
        ? "Sorry about that! Every payment is verified on-chain before a top-up is delivered, and if something didn't land we retry or refund automatically. I've flagged this to the team with your email — they'll follow up here and by email."
        : "Sorry about that! Every payment is verified on-chain before a top-up is delivered, and if something didn't land we retry or refund automatically. Leave your email below and the team will chase it for you.",
    };
  }

  if (/(how do (i|we)|can i|pay).{0,30}(usdc|wallet|crypto|arc)/.test(t) || /usdc/.test(t)) {
    return {
      reply:
        "At checkout, connect any EVM wallet (MetaMask, Coinbase, Trust or Rabby), approve the exact amount on Arc, and we confirm on-chain before delivering. No card needed — USDC is always worth $1.",
    };
  }

  if (/(countries|networks|where|coverage|which)/.test(t)) {
    return {
      reply:
        "We're live in Nigeria, Ghana, Kenya and South Africa — 14 mobile networks and 11 power utilities. More countries are on the way!",
    };
  }

  return {
    reply: email
      ? `Good question! If this needs a human, our team has your email (<strong>${email}</strong>) and your message — they'll get back to you here in the chat or by email. Meanwhile I'm happy to help with top-ups, payments and delivery.`
      : `Good question! I can help with top-ups, USDC payments and delivery. If you'd like our support team to reach you by email, leave your email below and they'll reply here in the chat too.`,
  };
}

function AgentAvatar({ online = true }: { online?: boolean }) {
  return (
    <span className="relative grid size-8 shrink-0 place-items-center rounded-full border-2 border-ink-950 bg-night text-white shadow-[0_2px_8px_-2px_rgba(10,10,10,0.45)]">
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-surface bg-emerald-400" />
      )}
    </span>
  );
}

function TypingDots() {
  return (
    <div className="flex w-fit items-center gap-2 rounded-[18px] rounded-bl-[6px] border-2 border-ink-950 bg-surface px-4 py-3 shadow-[0_1px_8px_-2px_rgba(10,10,10,0.12)]">
      <span className="flex items-center gap-1" aria-label="Ada is typing">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-ink-400 motion-reduce:animate-none"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
      <span className="text-xs font-semibold text-ink-400">Ada is typing…</span>
    </div>
  );
}

export function SupportChat() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [typing, setTyping] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [unread, setUnread] = React.useState(true);
  const [email, setEmail] = React.useState("");
  const [emailDraft, setEmailDraft] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const emailRef = React.useRef<HTMLInputElement | null>(null);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);
  const conv = React.useRef<string>("");
  const seenOwner = React.useRef<Set<string>>(new Set());
  const launcherRef = React.useRef<HTMLButtonElement | null>(null);

  // Restore persisted conversation + email (deferred so the initial render
  // stays SSR-safe — no synchronous setState inside the effect).
  React.useEffect(() => {
    conv.current = convId();
    let saved = "";
    try {
      const v = localStorage.getItem(EMAIL_KEY);
      if (v && EMAIL_RE.test(v)) saved = v;
    } catch {
      /* private mode */
    }
    const t = setTimeout(() => {
      if (saved) setEmail(saved);
      setMessages([
        {
          id: "w1",
          role: "agent",
          text: "Hi there! I'm Ada, the Afritop support assistant. How can I help you today?",
          time: timeNow(),
          from: "ai",
        },
      ]);
    }, 0);
    timers.current.push(t);
    return () => clearTimeout(t);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => (email ? inputRef : emailRef).current?.focus(), 350);
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
  }, [open, email]);

  React.useEffect(() => {
    const active = timers.current;
    return () => active.forEach(clearTimeout);
  }, []);

  // Pull owner replies from /api/support/inbox while the panel is open.
  React.useEffect(() => {
    if (!open || !conv.current) return;

    async function poll() {
      try {
        const res = await fetch(`/api/support/inbox?id=${encodeURIComponent(conv.current)}`);
        const data = await res.json();
        const ownerMsgs = (data?.messages ?? []).filter(
          (m: { role?: string; id: string }) => m.role === "owner",
        );
        const fresh = ownerMsgs.filter(
          (m: { id: string }) => !seenOwner.current.has(m.id),
        );
        if (fresh.length) {
          fresh.forEach((m: { id: string }) => seenOwner.current.add(m.id));
          setMessages((prev) => [
            ...prev,
            ...fresh.map((m: { id: string; text: string }) => ({
              id: `o-${m.id}`,
              role: "agent" as const,
              text: m.text,
              time: timeNow(),
              from: "team" as const,
            })),
          ]);
        }
      } catch {
        /* server unavailable — silent */
      }
    }

    void poll();
    const interval = setInterval(poll, 8000);
    return () => clearInterval(interval);
  }, [open]);

  const push = React.useCallback((msg: ChatMsg) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const agentReply = React.useCallback(
    (text: string, from: "ai" | "team" = "ai") => {
      setTyping(true);
      const t = setTimeout(() => {
        setTyping(false);
        push({ id: `a-${Date.now()}`, role: "agent", text, time: timeNow(), from });
      }, 900 + Math.random() * 600);
      timers.current.push(t);
    },
    [push],
  );

  const send = React.useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || typing) return;

      // Inline email capture — if the user types an address as a message.
      if (!email && EMAIL_RE.test(text)) {
        setEmail(text);
        try {
          localStorage.setItem(EMAIL_KEY, text);
        } catch {
          /* private mode */
        }
        push({ id: `u-${Date.now()}`, role: "user", text, time: timeNow() });
        setDraft("");
        const { reply } = autoReply(text, text);
        agentReply(reply);
        return;
      }

      push({ id: `u-${Date.now()}`, role: "user", text, time: timeNow() });
      setDraft("");

      // Persist + email the owner (fire-and-forget; failures are non-blocking).
      void fetch("/api/support/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conv.current, email, text }),
      }).catch(() => undefined);

      const { reply } = autoReply(text, email);
      agentReply(reply);
    },
    [typing, email, push, agentReply],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) send(draft);
  };

  const saveEmail = () => {
    const v = emailDraft.trim();
    if (!EMAIL_RE.test(v)) return;
    setEmail(v);
    setEmailDraft("");
    try {
      localStorage.setItem(EMAIL_KEY, v);
    } catch {
      /* private mode */
    }
    agentReply(
      `Got it — replies will go to <strong>${v}</strong> and show up right here in the chat. How can I help?`,
    );
  };

  const latestId = messages[messages.length - 1]?.id;
  const showQuickReplies = open && messages.length === 1 && !typing;

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
            "btn-cta group relative grid size-14 place-items-center rounded-full border-2 border-ink-950 bg-night text-white shadow-[0_10px_30px_-8px_rgba(10,10,10,0.6)] transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_16px_40px_-8px_rgba(10,10,10,0.7)]",
          )}
        >
          {open ? (
            <X className="size-6" />
          ) : (
            <Headset className="size-6" />
          )}

          {/* unread dot */}
          {unread && !open && (
            <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full border-2 border-ink-950 bg-sun-400 text-[10px] font-extrabold text-paper">
              1
            </span>
          )}

          {/* hover label */}
          <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full border-2 border-ink-950 bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink-950 opacity-0 shadow-[0_8px_20px_-8px_rgba(10,10,10,0.5)] transition-opacity duration-200 group-hover:opacity-100 sm:block">
            Chat with us
          </span>
        </button>
      </div>

      {/* ── Chat panel ───────────────────────────────────────── */}
      <div
        className={cn(
          "fixed z-[59] flex flex-col overflow-hidden border-2 border-ink-950 bg-surface transition-all duration-300 ease-out",
          "inset-x-0 bottom-0 h-[82dvh] max-h-[640px] rounded-t-[24px] sm:inset-x-auto sm:bottom-24 sm:right-6 sm:h-[600px] sm:w-[400px] sm:rounded-[24px] sm:shadow-[0_32px_80px_-16px_rgba(10,10,10,0.5)]",
          open
            ? "translate-y-0 opacity-100 sm:translate-y-0 sm:scale-100"
            : "pointer-events-none translate-y-8 opacity-0 sm:translate-y-4 sm:scale-[0.97]",
        )}
        role="dialog"
        aria-modal="false"
        aria-label="Afritop support chat"
        aria-hidden={!open}
        inert={!open || undefined}
      >
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden border-b-2 border-ink-950 bg-night px-5 pb-4 pt-4 text-white">
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden="true"
            style={{
              background:
                "radial-gradient(420px 150px at 12% -25%, rgba(212,255,63,0.16), transparent 70%)",
            }}
          />
          <div className="relative flex items-center gap-3">
            <span className="relative grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink-950 bg-surface text-ink-950 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.5)]">
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span className="absolute -bottom-0.5 -right-0.5 flex size-3.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex size-3.5 rounded-full border-2 border-night bg-emerald-400" />
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-bold tracking-tight text-white">
                Afritop Support
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/60">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Online — replies in seconds
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink-950 bg-surface text-ink-950 transition-all hover:-translate-y-0.5 hover:bg-brand-50"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Conversation */}
        <MessageScrollerProvider>
          <MessageScroller className="flex-1 border-t-2 border-ink-950 bg-paper">
            <MessageScrollerViewport className="px-4 pb-4 pt-5">
              <MessageScrollerContent className="gap-6">
                {messages.map((m) => {
                  const mine = m.role === "user";
                  return (
                    <MessageScrollerItem key={m.id} scrollAnchor={m.id === latestId}>
                      <Message align={mine ? "end" : "start"}>
                        {!mine && (
                          <MessageAvatar className="rounded-full">
                            <AgentAvatar />
                          </MessageAvatar>
                        )}
                        <MessageContent>
                          <MessageGroup className="gap-1.5">
                            {!mine && (
                              <MessageHeader>
                                {m.from === "team" ? "Support team" : "Ada · Afritop Support"}
                              </MessageHeader>
                            )}
                            <Bubble variant={mine ? "default" : "secondary"}>
                              <BubbleContent
                                className={cn(
                                  mine
                                    ? "rounded-[18px] rounded-br-[6px] shadow-[0_2px_12px_-4px_rgba(10,10,10,0.35)]"
                                    : "rounded-[18px] rounded-bl-[6px] shadow-[0_1px_8px_-2px_rgba(10,10,10,0.12)]",
                                )}
                                dangerouslySetInnerHTML={{ __html: safeHtml(m.text) }}
                              />
                            </Bubble>
                          </MessageGroup>
                          <MessageFooter>
                            <span className="flex items-center gap-1">
                              {m.time}
                              {mine && <CheckCheck className="size-3.5 text-brand-500" />}
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
                      <MessageAvatar className="rounded-full">
                        <AgentAvatar />
                      </MessageAvatar>
                      <MessageContent>
                        <TypingDots />
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                )}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton aria-label="Scroll to latest message" />
          </MessageScroller>
        </MessageScrollerProvider>

        {/* Quick replies — shown on the welcome message */}
        {showQuickReplies && (
          <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto border-t-2 border-ink-950 bg-paper px-4 py-3">
            {QUICK_REPLIES.map((q) => {
              const Icon = q.icon;
              return (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => send(q.label)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-ink-950 bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink-700 transition-all hover:-translate-y-0.5 hover:bg-brand-50 hover:text-ink-950"
                >
                  <Icon className="size-3.5" aria-hidden="true" />
                  {q.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Email capture */}
        {email ? (
          <div
            className={cn(
              "flex shrink-0 items-center gap-2 bg-paper px-4 py-2.5",
              !showQuickReplies && "border-t-2 border-ink-950",
            )}
          >
            <Mail className="size-3.5 shrink-0 text-ink-500" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink-500">
              Replies go to <span className="text-ink-900">{email}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setEmail("");
                try {
                  localStorage.removeItem(EMAIL_KEY);
                } catch {
                  /* private mode */
                }
              }}
              aria-label="Remove email"
              className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-ink-950 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-950"
            >
              <X className="size-3" />
            </button>
          </div>
        ) : (
          <div
            className={cn(
              "flex shrink-0 items-center gap-2 bg-paper px-4 py-2.5",
              !showQuickReplies && "border-t-2 border-ink-950",
            )}
          >
            <input
              ref={emailRef}
              value={emailDraft}
              onChange={(e) => setEmailDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) saveEmail();
              }}
              placeholder="Your email — so the team can reply"
              aria-label="Your email address"
              className="min-w-0 flex-1 rounded-full border-2 border-ink-950 bg-surface px-3.5 py-2 text-xs font-semibold text-ink-950 outline-none transition-colors placeholder:text-ink-400 focus:bg-paper"
            />
            <button
              type="button"
              onClick={saveEmail}
              disabled={!EMAIL_RE.test(emailDraft.trim())}
              className="btn-cta shrink-0 rounded-full border-2 border-ink-950 bg-night px-4 py-2 text-xs font-bold text-white transition-all hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save
            </button>
          </div>
        )}

        {/* Composer */}
        <div className="shrink-0 border-t-2 border-ink-950 bg-surface px-4 py-3.5">
          <div className="flex items-center gap-2 rounded-full border-2 border-ink-950 bg-paper py-1.5 pl-4 pr-1.5 transition-shadow focus-within:shadow-[0_0_0_3px_rgba(212,255,63,0.4)]">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Type your message…"
              aria-label="Message Ada"
              className="min-w-0 flex-1 bg-transparent py-2 text-sm text-ink-950 outline-none placeholder:text-ink-400"
            />
            <button
              type="button"
              onClick={() => send(draft)}
              disabled={!draft.trim() || typing}
              aria-label="Send message"
              className="btn-cta grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink-950 bg-night text-white transition-all hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="size-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] font-semibold text-ink-400">
            For anything urgent, the team also replies by email — just save yours above.
          </p>
        </div>
      </div>
    </>
  );
}

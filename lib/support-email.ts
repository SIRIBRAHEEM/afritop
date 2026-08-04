/**
 * Support email delivery — talks to the Resend REST API directly (no SDK).
 *
 * The owner's inbox (SUPPORT_EMAIL, default ibramzzzy@gmail.com) receives every
 * customer chat message. Replies loop back into the customer's chat through
 * /api/support/inbound when SUPPORT_INBOUND_DOMAIN is configured: the outbound
 * email's reply-to becomes `afritop+<conversationId>@<domain>`, so the owner can
 * simply hit Reply in Gmail and the webhook attributes the answer to the right
 * conversation.
 *
 * Env:
 *   RESEND_API_KEY          — required for real delivery (free tier: 100/day, 3k/mo).
 *   SUPPORT_EMAIL           — owner inbox (default ibramzzzy@gmail.com).
 *   SUPPORT_EMAIL_FROM      — verified sender, e.g. "Afritop <support@yourdomain.com>".
 *   SUPPORT_INBOUND_DOMAIN  — e.g. "support.yourdomain.com" (must have Resend
 *                             inbound DNS records: MX + SPF/TXT). Enables the
 *                             Gmail-reply → chat loop.
 *
 * Note: Resend's default `onboarding@resend.dev` sender can only deliver to the
 * account owner — verifying your own domain is required to reach any Gmail.
 */

export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "ibramzzzy@gmail.com";
export const SUPPORT_INBOUND_DOMAIN = process.env.SUPPORT_INBOUND_DOMAIN || "";
export const SUPPORT_FROM =
  process.env.SUPPORT_EMAIL_FROM || "Afritop Support <onboarding@resend.dev>";

export function isSupportEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Conversation ids are embedded in the local part of reply-to addresses. */
export function encodeConv(convId: string): string {
  return Buffer.from(convId).toString("base64url");
}

export function decodeConv(localPart: string): string | null {
  const m = /^afritop\+([A-Za-z0-9_-]+)$/.exec(localPart);
  if (!m) return null;
  try {
    return Buffer.from(m[1], "base64url").toString("utf8");
  } catch {
    return null;
  }
}

/** Strip the quoted history Gmail appends when replying. */
export function stripQuote(text: string): string {
  return text
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (t.startsWith(">")) return false;
      if (/^On .+ wrote:$/.test(t)) return false;
      if (/^_{10,}$/.test(t)) return false;
      return true;
    })
    .join("\n")
    .trim();
}

export async function sendSupportEmail(opts: {
  convId: string;
  email?: string;
  text: string;
}): Promise<{ ok: boolean; note?: string }> {
  if (!isSupportEmailConfigured()) {
    return {
      ok: false,
      note: "RESEND_API_KEY is not set — message saved to the thread but no email was sent.",
    };
  }

  const replyTo = SUPPORT_INBOUND_DOMAIN
    ? `afritop+${encodeConv(opts.convId)}@${SUPPORT_INBOUND_DOMAIN}`
    : undefined;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY as string}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: SUPPORT_FROM,
      to: [SUPPORT_EMAIL],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject: `[Afritop support] ${opts.email || "anonymous"} — ${opts.text.slice(0, 60)}`,
      text: [
        "New support message from the Afritop chat widget:",
        "",
        `From: ${opts.email || "(no email provided — conversation " + opts.convId + ")"}`,
        `Conversation: ${opts.convId}`,
        "",
        "Message:",
        opts.text,
        "",
        replyTo
          ? "Reply to this email and your answer will appear in the customer's chat automatically."
          : "Set SUPPORT_INBOUND_DOMAIN (with Resend inbound records) so the customer can see your reply in the chat.",
      ].join("\n"),
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, note: `Resend error ${res.status}: ${body.slice(0, 200)}` };
  }
  return { ok: true };
}

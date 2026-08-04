import { NextResponse } from "next/server";
import { appendMessage } from "@/lib/support-store";
import { decodeConv, stripQuote } from "@/lib/support-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Inbound webhook — receives owner email replies routed through Resend inbound.
 *
 * The owner replies in Gmail to `afritop+<conversationId>@<SUPPORT_INBOUND_DOMAIN>`;
 * Resend posts the message here and we append it to the customer's thread, which
 * the chat widget picks up on its next poll.
 *
 * Accepts Resend's payload (type: "email.received", data.to as array of objects)
 * as well as a flattened { from, to, subject, text } shape for manual testing.
 */
export async function POST(req: Request) {
  // Fail closed: the webhook only accepts requests when the shared secret is
  // configured AND supplied. Without this, anyone could inject owner-imperson-
  // ating messages into customer threads. (For stricter verification, validate
  // Resend's svix-signature header instead of the custom header.)
  const secret = process.env.SUPPORT_INBOUND_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "inbound not configured — set SUPPORT_INBOUND_SECRET" },
      { status: 503 },
    );
  }
  if (req.headers.get("x-afritop-secret") !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const data = payload?.type === "email.received" ? payload.data : payload;
  if (!data) {
    return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
  }

  const toList = Array.isArray(data.to)
    ? data.to
        .map((t: unknown) => {
          if (typeof t === "string") return t;
          if (t && typeof t === "object" && "address" in t) return String((t as { address: unknown }).address);
          return "";
        })
        .filter(Boolean)
    : typeof data.to === "string"
      ? [data.to]
      : [];

  // Conversation id lives in the local part of the recipient address.
  let convId: string | null = null;
  for (const to of toList) {
    const local = String(to).split("@")[0] ?? "";
    const decoded = decodeConv(local);
    if (decoded) {
      convId = decoded;
      break;
    }
  }
  if (!convId) {
    // Unattributable (e.g. a stray message to a generic address) — ack so the
    // provider stops retrying, and log it.
    console.warn("[support-inbound] no conversation id in recipients:", toList);
    return NextResponse.json({ ok: false, error: "no conversation id" }, { status: 200 });
  }

  const rawText = typeof data.text === "string" ? data.text : "";
  const subject = (typeof data.subject === "string" ? data.subject : "").slice(0, 200);
  const text = stripQuote(rawText).slice(0, 2000) || `(no text) — ${subject}`;

  await appendMessage(convId, {
    id: crypto.randomUUID(),
    role: "owner",
    text,
    at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}

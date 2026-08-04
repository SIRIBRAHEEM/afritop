import { NextResponse } from "next/server";
import { appendMessage } from "@/lib/support-store";
import { sendSupportEmail } from "@/lib/support-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Simple in-memory rate limiter. Bounds abuse of the owner's inbox without
 * adding a dependency. Note: per server instance — fine for a single instance;
 * use Redis for a distributed limit in production.
 */
const buckets = new Map<string, { count: number; reset: number }>();
function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > max;
}

/**
 * Conversation ids are client-generated; also bound them so the base64url
 * form always fits the 64-char email local-part limit in reply-to addresses.
 */
const CONV_RE = /^cv_[A-Za-z0-9_-]{1,32}$/;

/** A customer sent a message in the support chat. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const convId = typeof body?.conversationId === "string" ? body.conversationId.trim() : "";
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 2000) : "";
  const email = typeof body?.email === "string" ? body.email.trim().slice(0, 200) : "";

  if (!convId || !text) {
    return NextResponse.json({ ok: false, error: "conversationId and text are required" }, { status: 400 });
  }
  if (!CONV_RE.test(convId)) {
    return NextResponse.json({ ok: false, error: "invalid conversation id" }, { status: 400 });
  }

  // 10 messages per conversation per minute; 30 per IP per hour.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  if (rateLimited(`conv:${convId}`, 10, 60_000)) {
    return NextResponse.json({ ok: false, error: "too many messages — please slow down" }, { status: 429 });
  }
  if (rateLimited(`ip:${ip}`, 30, 3_600_000)) {
    return NextResponse.json({ ok: false, error: "rate limit reached — try again later" }, { status: 429 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "invalid email address" }, { status: 400 });
  }

  await appendMessage(convId, {
    id: crypto.randomUUID(),
    role: "customer",
    text,
    at: new Date().toISOString(),
  });

  const emailResult = await sendSupportEmail({ convId, email, text });

  return NextResponse.json({ ok: true, emailSent: emailResult.ok, note: emailResult.note });
}

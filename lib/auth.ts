import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { NextResponse } from "next/server";

/**
 * Server-side wallet-auth primitives (no external auth service):
 *
 *  - A sign-in "nonce" is an HMAC-signed token embedding { nonce, issuedAt, exp }.
 *    Stateless (no server memory), replay-safe (10 min TTL), and it pins the
 *    issuedAt the client must use when building the message to sign.
 *  - A "session" is an HMAC-signed token embedding { a: address, e: expiry },
 *    stored in an HTTP-only SameSite cookie. Verified on every request.
 *
 * Set AUTH_SECRET in production so sessions survive across serverless instances.
 */

const SECRET = process.env.AUTH_SECRET || "afritop-dev-auth-secret-change-me";
if (!process.env.AUTH_SECRET && process.env.NODE_ENV === "production") {
  // A predictable fallback secret would let anyone forge a session cookie for any
  // wallet address. Never run production without AUTH_SECRET.
  console.warn(
    "[auth] AUTH_SECRET is not set. Sessions are signed with the insecure dev fallback. Set AUTH_SECRET in production.",
  );
}
export const SESSION_COOKIE = "afritop_session";

const NONCE_TTL_MS = 10 * 60 * 1000; // 10 minutes to complete sign-in
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function hmac(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const ha = createHmac("sha256", SECRET).update(a).digest();
  const hb = createHmac("sha256", SECRET).update(b).digest();
  return timingSafeEqual(ha, hb);
}

function b64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromB64url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

/* ── Signed nonce ────────────────────────────────────────────── */

export interface NonceInfo {
  nonce: string;
  issuedAt: string;
  token: string;
}

export function createSignedNonce(): NonceInfo {
  const nonce = randomBytes(24).toString("hex");
  const issuedAt = new Date().toISOString();
  const exp = Date.now() + NONCE_TTL_MS;
  const payload = b64url(JSON.stringify({ nonce, issuedAt, exp }));
  return { nonce, issuedAt, token: `${payload}.${hmac(payload)}` };
}

/** Returns the pinned nonce + issuedAt when the token is authentic and fresh. */
export function verifySignedNonce(
  token: string,
): { nonce: string; issuedAt: string } | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig || !safeEqual(sig, hmac(payload))) return null;
    const data = JSON.parse(fromB64url(payload)) as { nonce: string; issuedAt: string; exp: number };
    if (typeof data.nonce !== "string" || typeof data.issuedAt !== "string") return null;
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return { nonce: data.nonce, issuedAt: data.issuedAt };
  } catch {
    return null;
  }
}

/** Constant-time comparison for the exact signed message. */
export function safeEqualMessages(a: string, b: string): boolean {
  return safeEqual(a, b);
}

/* ── Session token ───────────────────────────────────────────── */

export function createSessionToken(address: string): string {
  const payload = b64url(JSON.stringify({ a: address, e: Date.now() + SESSION_TTL_SECONDS * 1000 }));
  return `${payload}.${hmac(payload)}`;
}

/** Returns the wallet address when the session token is authentic + unexpired. */
export function readSessionToken(token: string): string | null {
  try {
    const [payload, sig] = token.split(".");
    if (!payload || !sig || !safeEqual(sig, hmac(payload))) return null;
    const data = JSON.parse(fromB64url(payload)) as { a: string; e: number };
    if (typeof data.a !== "string" || typeof data.e !== "number" || data.e < Date.now()) return null;
    return data.a;
  } catch {
    return null;
  }
}

/** Read the session cookie from a request and return the signed-in address. */
export function getSessionAddress(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (!match) return null;
  return readSessionToken(decodeURIComponent(match.slice(SESSION_COOKIE.length + 1)));
}

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

export function setSessionCookie(response: NextResponse, address: string): void {
  response.cookies.set(SESSION_COOKIE, createSessionToken(address), cookieOptions);
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", {
    ...cookieOptions,
    maxAge: 0,
  });
}

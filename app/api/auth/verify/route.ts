import { NextResponse } from "next/server";
import { verifyMessage, getAddress } from "viem";
import {
  verifySignedNonce,
  safeEqualMessages,
  setSessionCookie,
} from "@/lib/auth";
import { buildAuthMessage } from "@/lib/auth-message";

export const runtime = "nodejs";

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

function requestHost(request: Request): string {
  return (
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "localhost:3000"
  );
}

/**
 * POST /api/auth/verify
 * Body: { address, message, signature, nonceToken }
 *
 * 1. The nonce token must be authentic + unexpired (server-pinned issuedAt).
 * 2. The message must match — byte-for-byte — what this server would have
 *    signed for this address, nonce and domain (kills signature-replay).
 * 3. The signature must recover to `address` (pure ECDSA — no RPC needed).
 * On success an HTTP-only session cookie is set.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, message, signature, nonceToken } = body;
    if (!address || !message || !signature || !nonceToken) {
      return json(400, { error: "Missing address, message, signature or nonce." });
    }

    let checksummed: `0x${string}`;
    try {
      checksummed = getAddress(String(address));
    } catch {
      return json(400, { error: "Invalid wallet address." });
    }

    const nonceInfo = verifySignedNonce(String(nonceToken));
    if (!nonceInfo) {
      return json(401, { error: "This sign-in request has expired. Please try again." });
    }

    const expected = buildAuthMessage({
      address: checksummed,
      nonce: nonceInfo.nonce,
      issuedAt: nonceInfo.issuedAt,
      domain: requestHost(request),
    });
    if (!safeEqualMessages(String(message), expected)) {
      return json(401, { error: "The sign-in message doesn't match. Please try again." });
    }

    const valid = await verifyMessage({
      address: checksummed,
      message: String(message),
      signature: String(signature) as `0x${string}`,
    });
    if (!valid) {
      return json(401, { error: "Signature verification failed. Please try again." });
    }

    const response = NextResponse.json({ ok: true, address: checksummed });
    setSessionCookie(response, checksummed);
    return response;
  } catch (err) {
    console.error("[auth/verify] error", err);
    return json(500, { error: "Something went wrong. Please try again." });
  }
}

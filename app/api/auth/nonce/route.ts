import { NextResponse } from "next/server";
import { createSignedNonce } from "@/lib/auth";

export const runtime = "nodejs";

/** GET /api/auth/nonce — fresh, time-limited sign-in nonce (pinned to server time). */
export async function GET() {
  const { token, nonce, issuedAt } = createSignedNonce();
  return NextResponse.json({ token, nonce, issuedAt });
}

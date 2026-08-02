import { NextResponse } from "next/server";
import { getSessionAddress } from "@/lib/auth";
import { listOrdersByWallet } from "@/lib/store";

export const runtime = "nodejs";

/**
 * GET /api/transactions — the signed-in wallet's cloud history (newest first).
 * When no valid session is present we return an empty list plus
 * `authenticated: false` so the UI can show the sign-in prompt instead.
 */
export async function GET(request: Request) {
  const address = getSessionAddress(request);
  if (!address) {
    return NextResponse.json({ orders: [], authenticated: false, address: null });
  }
  const orders = await listOrdersByWallet(address);
  return NextResponse.json({ orders, authenticated: true, address });
}

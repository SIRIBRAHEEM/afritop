import { NextResponse } from "next/server";
import { getSessionAddress } from "@/lib/auth";

export const runtime = "nodejs";

/** GET /api/auth/session — the signed-in wallet address (or null). */
export async function GET(request: Request) {
  const address = getSessionAddress(request);
  return NextResponse.json({ address });
}

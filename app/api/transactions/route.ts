import { NextResponse } from "next/server";
import { listOrders } from "@/lib/store";

export const runtime = "nodejs";

/** GET /api/transactions — newest first. */
export async function GET() {
  const orders = await listOrders();
  return NextResponse.json({ orders });
}

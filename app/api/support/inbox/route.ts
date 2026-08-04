import { NextResponse } from "next/server";
import { getThread } from "@/lib/support-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONV_RE = /^cv_[A-Za-z0-9_-]{1,32}$/;

/** The chat widget polls this to pick up owner replies for its conversation. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const convId = searchParams.get("id")?.trim() ?? "";
  if (!CONV_RE.test(convId)) return NextResponse.json({ messages: [] });

  const thread = await getThread(convId);
  return NextResponse.json({ messages: thread });
}

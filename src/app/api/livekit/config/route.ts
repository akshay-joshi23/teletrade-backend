import { NextResponse } from "next/server";

/**
 * Expose a safe, client-usable LiveKit URL when NEXT_PUBLIC_LIVEKIT_URL
 * is not defined. We DO NOT leak API key/secret here.
 */
export async function GET() {
  const url = process.env.LIVEKIT_URL || "";
  const ok = Boolean(url);
  return NextResponse.json({ ok, serverUrl: url }, { status: 200 });
}



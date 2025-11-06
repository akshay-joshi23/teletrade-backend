import { NextResponse } from "next/server";

/**
 * Expose a safe, client-usable LiveKit URL for the browser.
 * Priority: NEXT_PUBLIC_LIVEKIT_URL (client) → LIVEKIT_URL (server).
 * We DO NOT leak API key/secret here.
 */
export async function GET() {
  const nextPublic = process.env.NEXT_PUBLIC_LIVEKIT_URL || "";
  const serverOnly = process.env.LIVEKIT_URL || "";
  const serverUrl = nextPublic || serverOnly;
  return NextResponse.json(
    {
      ok: Boolean(serverUrl),
      serverUrl,
      diagnostics: {
        nextPublic_present: Boolean(nextPublic),
        livekitUrl_present: Boolean(serverOnly),
      },
    },
    { status: 200 },
  );
}



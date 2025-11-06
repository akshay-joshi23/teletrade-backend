import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      commit: {
        sha: process.env.VERCEL_GIT_COMMIT_SHA || "local",
        branch: process.env.VERCEL_GIT_COMMIT_REF || "local",
      },
      livekit: {
        serverUrl_present: !!process.env.LIVEKIT_URL,
        apiKey_present: !!process.env.LIVEKIT_API_KEY,
        apiSecret_present: !!process.env.LIVEKIT_API_SECRET,
        nextPublic_present: !!process.env.NEXT_PUBLIC_LIVEKIT_URL,
      },
      time: new Date().toISOString(),
    },
    { status: 200 },
  );
}



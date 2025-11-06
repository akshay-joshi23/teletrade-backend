import { NextRequest, NextResponse } from "next/server";
import { handleCorsPreflight, withCors } from "@/lib/cors";

export async function GET(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  if (pre) return pre;
  return withCors(
    req,
    NextResponse.json(
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
    ),
  );
}

export async function OPTIONS(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  return pre ?? NextResponse.json(null, { status: 204 });
}



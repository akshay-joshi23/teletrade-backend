import { NextRequest, NextResponse } from "next/server";
import { handleCorsPreflight, withCors } from "@/lib/cors";

export async function GET(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  if (pre) return pre;
  const baseUrl = `${req.nextUrl.origin}/api`;
  const payload = {
    version: "1.0",
    baseUrl,
    endpoints: [
      {
        path: "/rooms",
        method: "POST",
        bodyExample: { role: "homeowner", trade: "PLUMBER" },
        responseExample: { id: "abc123", status: "PENDING" },
      },
      {
        path: "/rooms/{id}",
        method: "GET",
        responseExample: { id: "abc123", status: "ACTIVE", participants: 2 },
      },
      {
        path: "/livekit/token",
        method: "POST",
        bodyExample: { roomId: "abc123" },
        responseExample: { token: "<jwt>" },
      },
    ],
    auth: {
      nextAuthSignin: "/auth/signin",
      google: "/auth/signin/google",
      callback: "/auth/callback/google",
      notes: "Use callbackUrl back to the Lovable page.",
    },
  };
  return withCors(req, NextResponse.json(payload, { status: 200 }));
}

export async function OPTIONS(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  return pre ?? NextResponse.json(null, { status: 204 });
}



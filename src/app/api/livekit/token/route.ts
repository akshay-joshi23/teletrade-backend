import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function b64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signHS256(header: object, payload: object, secret: string) {
  const headerB64 = b64url(JSON.stringify(header));
  const payloadB64 = b64url(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${data}.${sig}`;
}

const ROOM_RE = /^[A-Za-z0-9_-]{1,64}$/;

export async function POST(req: NextRequest) {
  const url = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!url || !apiKey || !apiSecret) {
    return NextResponse.json({ message: "LiveKit env not configured" }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "invalid json" }, { status: 400 });
  }
  const { roomId, userLabel } = (body ?? {}) as { roomId?: string; userLabel?: string };
  if (!roomId || !ROOM_RE.test(roomId)) {
    return NextResponse.json({ message: "invalid roomId" }, { status: 400 });
  }

  const session = req.cookies.get("tt_session")?.value || crypto.randomUUID();
  const roleHeader = req.headers.get("x-tt-role");
  const prefix = roleHeader === "homeowner" ? "HO" : roleHeader === "pro" ? "PRO" : "User";
  const last4 = session.slice(-4);
  const identity = `${prefix}-${last4}`;
  const name = userLabel?.slice(0, 64) || identity;

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60; // 1 hour
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    iss: apiKey,
    iat: now,
    exp,
    sub: identity,
    name,
    video: {
      room: roomId,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    },
  } as const;

  const token = signHS256(header, payload, apiSecret);
  return NextResponse.json({ token, url }, { status: 200 });
}



import { NextRequest, NextResponse } from "next/server";

const ALLOWED_METHODS = "GET,POST,OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization";

function getAllowedOrigin(req: NextRequest): string | null {
  const requestOrigin = req.headers.get("origin");
  const allowed = process.env.ALLOWED_ORIGIN || "";
  if (!requestOrigin || !allowed) return null;
  try {
    const reqUrl = new URL(requestOrigin);
    const allowedUrl = new URL(allowed);
    return reqUrl.origin === allowedUrl.origin ? reqUrl.origin : null;
  } catch {
    return null;
  }
}

export function handleCorsPreflight(req: NextRequest): NextResponse | null {
  if (req.method !== "OPTIONS") return null;
  const origin = getAllowedOrigin(req);
  const res = new NextResponse(null, { status: 204 });
  if (origin) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }
  res.headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
  res.headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
  return res;
}

export function withCors(req: NextRequest, res: NextResponse): NextResponse {
  const origin = getAllowedOrigin(req);
  if (origin) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Vary", "Origin");
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }
  res.headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
  res.headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
  return res;
}



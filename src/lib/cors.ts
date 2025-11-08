import { NextRequest, NextResponse } from "next/server";

const ALLOWED_METHODS = "GET,POST,OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization";

function resolveAllowedOrigin(req: NextRequest): string | null {
  const requestOrigin = req.headers.get("origin");
  const configured = (process.env.ALLOWED_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!requestOrigin) return null;
  if (configured.length === 0) return requestOrigin; // fallback: echo
  try {
    const reqOrigin = new URL(requestOrigin).origin;
    for (const o of configured) {
      try {
        if (new URL(o).origin === reqOrigin) return reqOrigin;
      } catch {
        // skip invalid configured origins
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function handleCorsPreflight(req: NextRequest): NextResponse | null {
  if (req.method !== "OPTIONS") return null;
  const origin = resolveAllowedOrigin(req);
  const res = new NextResponse(null, { status: 204 });
  if (origin) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  }
  res.headers.set("Vary", "Origin");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
  res.headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
  return res;
}

export function withCors(req: NextRequest, res: NextResponse): NextResponse {
  const origin = resolveAllowedOrigin(req);
  if (origin) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  }
  res.headers.set("Vary", "Origin");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
  res.headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
  return res;
}

export function json(req: NextRequest, data: unknown, init: ResponseInit = {}) {
  return withCors(
    req,
    NextResponse.json(data, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      } as any,
    }),
  );
}

export function error(req: NextRequest, status: number, message: string) {
  return json(req, { error: message }, { status });
}

export function preflight(req: NextRequest) {
  return handleCorsPreflight(req) ?? new NextResponse(null, { status: 204 });
}



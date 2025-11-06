import { NextRequest, NextResponse } from "next/server";

const ALLOWED_METHODS = "GET,POST,OPTIONS";
const ALLOWED_HEADERS = "Content-Type, Authorization";

export function getOrigin(req: NextRequest): string {
  return req.headers.get("origin") || process.env.ALLOWED_ORIGIN || "*";
}

export function handleCorsPreflight(req: NextRequest): NextResponse | null {
  if (req.method !== "OPTIONS") return null;
  const origin = getOrigin(req);
  const res = new NextResponse(null, { status: 204 });
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Vary", "Origin");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
  res.headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
  return res;
}

export function withCors(req: NextRequest, res: NextResponse): NextResponse {
  const origin = getOrigin(req);
  res.headers.set("Access-Control-Allow-Origin", origin);
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



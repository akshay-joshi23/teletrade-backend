import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "tt_session";
const THIRTY_DAYS_S = 60 * 60 * 24 * 30;

export function middleware(req: NextRequest) {
  // This middleware runs only for /api/* (see matcher below)
  const res = NextResponse.next();
  const existing = req.cookies.get(COOKIE_NAME)?.value;
  if (!existing) {
    const id = crypto.randomUUID();
    const requestOrigin = req.headers.get("origin");
    const allowed = process.env.ALLOWED_ORIGIN || "";
    let sameSite: "lax" | "none" = "lax";
    let secure = false;
    try {
      if (requestOrigin && allowed) {
        // If request origin matches one of allowed origins, set cross-site cookie
        const allowedOrigins = allowed.split(",").map((s) => s.trim()).filter(Boolean);
        const requestOriginUrl = new URL(requestOrigin).origin;
        if (allowedOrigins.some((o) => {
          try {
            return new URL(o).origin === requestOriginUrl;
          } catch {
            return false;
          }
        })) {
          sameSite = "none";
          secure = true;
        }
      }
    } catch {}
    res.cookies.set({
      name: COOKIE_NAME,
      value: id,
      path: "/",
      httpOnly: true,
      sameSite,
      secure,
      maxAge: THIRTY_DAYS_S,
    });
  }
  return res;
}

export const config = {
  // IMPORTANT: only match /api/*
  matcher: ["/api/:path*"],
};



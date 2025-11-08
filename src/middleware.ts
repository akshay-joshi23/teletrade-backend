import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "tt_session";
const THIRTY_DAYS_S = 60 * 60 * 24 * 30;

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  // Only /api/* is allowed; everything else returns JSON 404
  if (!path.startsWith("/api")) {
    return new NextResponse(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  // For API requests, ensure an anonymous session cookie exists
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
  matcher: ["/((?!_next|favicon.ico).*)"],
};



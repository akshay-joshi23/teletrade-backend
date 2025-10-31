import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "tt_session";
const THIRTY_DAYS_S = 60 * 60 * 24 * 30;

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const existing = req.cookies.get(COOKIE_NAME)?.value;
  if (!existing) {
    const id = crypto.randomUUID();
    res.cookies.set({
      name: COOKIE_NAME,
      value: id,
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: THIRTY_DAYS_S,
    });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next|api/health|favicon.ico).*)"],
};



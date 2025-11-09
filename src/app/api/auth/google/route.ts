import { NextRequest, NextResponse } from "next/server";

// Allow Google OAuth redirect URI to use /api/auth/google by forwarding to NextAuth's callback path.
export async function GET(req: NextRequest) {
  const target = new URL("/api/auth/callback/google", req.nextUrl.origin);
  target.search = req.nextUrl.search;
  return NextResponse.redirect(target);
}



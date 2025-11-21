import { NextRequest, NextResponse } from "next/server";

function b64url(input: string) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const frontendBase = process.env.FRONTEND_BASE_URL || "";
  if (!clientId) {
    const msg = "Missing GOOGLE_CLIENT_ID";
    try {
      console.error("[auth/google] " + msg);
    } catch {}
    // Fallback to home if misconfigured
    return NextResponse.redirect(new URL("/", req.nextUrl.origin));
  }

  const { searchParams } = new URL(req.url);
  const callbackUrlParam = searchParams.get("callbackUrl") || "";
  const roleParam = searchParams.get("role") || "";

  // Encode state so we can round-trip callbackUrl and role
  const statePayload = JSON.stringify({ callbackUrl: callbackUrlParam, role: roleParam });
  const state = b64url(statePayload);

  const redirectUri = new URL("/api/auth/callback/google", req.nextUrl.origin).toString();
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("access_type", "online");
  authUrl.searchParams.set("include_granted_scopes", "true");
  authUrl.searchParams.set("state", state);
  // Optional UX hints - keep minimal; prompt=consent can be too aggressive for returning users
  // authUrl.searchParams.set("prompt", "select_account");

  try {
    console.log("[auth/google] redirecting to Google OAuth", {
      redirectUri,
      hasFrontendBase: !!frontendBase,
    });
  } catch {}

  return NextResponse.redirect(authUrl, { status: 302 });
}



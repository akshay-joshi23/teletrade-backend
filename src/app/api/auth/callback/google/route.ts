import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signJwt } from "@/lib/jwt";

function b64urlDecode(input: string): string {
  // add base64 padding
  const pad = input.length % 4 === 2 ? "==" : input.length % 4 === 3 ? "=" : "";
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(b64, "base64").toString("utf8");
}

type GoogleTokens = {
  access_token: string;
  expires_in: number;
  id_token?: string;
  scope?: string;
  token_type: string;
  refresh_token?: string;
};

type GoogleUserInfo = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code") || "";
  const rawState = searchParams.get("state") || "";

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const jwtSecret = process.env.JWT_SECRET;
  const frontendBase = process.env.FRONTEND_BASE_URL || "/";

  function resolveFrontendTarget(defaultPath = "/auth/callback", query: Record<string, string> = {}) {
    const fallback = new URL(defaultPath, frontendBase).toString();
    const pairs = new URLSearchParams(query).toString();
    const target = pairs ? `${fallback}?${pairs}` : fallback;
    return target;
  }

  // Decode state
  let state: { callbackUrl?: string; role?: string } = {};
  if (rawState) {
    try {
      state = JSON.parse(b64urlDecode(rawState));
    } catch {
      // ignore invalid state
    }
  }

  if (!code) {
    try {
      console.warn("[auth/callback/google] missing code");
    } catch {}
    return NextResponse.redirect(resolveFrontendTarget("/auth/callback", { error: "missing_code" }));
  }
  if (!clientId || !clientSecret) {
    try {
      console.error("[auth/callback/google] Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET");
    } catch {}
    return NextResponse.redirect(resolveFrontendTarget("/auth/callback", { error: "server_misconfigured" }));
  }

  const redirectUri = new URL("/api/auth/callback/google", req.nextUrl.origin).toString();

  try {
    // Exchange authorization code
    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      } as Record<string, string>),
      cache: "no-store",
    });
    if (!tokenResp.ok) {
      const text = await tokenResp.text().catch(() => "");
      throw new Error(`Token exchange failed: ${tokenResp.status} ${tokenResp.statusText} ${text}`);
    }
    const tokens = (await tokenResp.json()) as GoogleTokens;

    // Fetch profile
    const userResp = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: "no-store",
    });
    if (!userResp.ok) {
      const text = await userResp.text().catch(() => "");
      throw new Error(`Userinfo fetch failed: ${userResp.status} ${userResp.statusText} ${text}`);
    }
    const profile = (await userResp.json()) as GoogleUserInfo;

    // Map to internal user; require at least sub
    if (!profile?.sub) {
      throw new Error("Missing Google user sub");
    }

    // Upsert User by email if present; otherwise create anonymous user keyed by account link
    let userId: string;
    const email = (profile.email || "").toLowerCase() || null;
    const name = profile.name || null;
    const image = profile.picture || null;

    if (email) {
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          name: name ?? undefined,
          image: image ?? undefined,
          updatedAt: new Date(),
        },
        create: {
          email,
          name,
          image,
        },
        select: { id: true },
      });
      userId = user.id;
    } else {
      // Create a user without email; ensure uniqueness by Google account link
      // Attempt to find existing Account to get userId
      const existing = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider: "google", providerAccountId: profile.sub } },
        select: { userId: true },
      });
      if (existing?.userId) {
        userId = existing.userId;
      } else {
        const created = await prisma.user.create({
          data: { name, image },
          select: { id: true },
        });
        userId = created.id;
      }
    }

    // Upsert Account link (NextAuth-compatible schema)
    const expiresAt = tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null;
    await prisma.account.upsert({
      where: { provider_providerAccountId: { provider: "google", providerAccountId: profile.sub } },
      update: {
        userId,
        type: "oauth",
        access_token: tokens.access_token ?? null,
        refresh_token: tokens.refresh_token ?? null,
        id_token: tokens.id_token ?? null,
        scope: tokens.scope ?? null,
        token_type: tokens.token_type ?? null,
        expires_at: expiresAt ?? undefined,
      },
      create: {
        userId,
        type: "oauth",
        provider: "google",
        providerAccountId: profile.sub,
        access_token: tokens.access_token ?? null,
        refresh_token: tokens.refresh_token ?? null,
        id_token: tokens.id_token ?? null,
        scope: tokens.scope ?? null,
        token_type: tokens.token_type ?? null,
        expires_at: expiresAt ?? undefined,
      },
    });

    // Compose JWT for frontend
    if (!jwtSecret) {
      throw new Error("Missing JWT_SECRET");
    }
    // Fetch current role for the user if DB configured (DATABASE_URL may be missing in some envs)
    let role: string | null = null;
    try {
      const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, email: true, name: true, image: true } });
      if (u?.role) role = String(u.role);
    } catch {}

    const token = signJwt(
      {
        email: email,
        name,
        picture: image,
        role: role,
        provider: "google",
      },
      jwtSecret,
      { subject: userId, expSeconds: 60 * 60 * 24 * 7 }, // 7 days
    );

    // Build user payload for frontend
    const userPayload = {
      id: userId,
      email,
      name,
      image,
      role,
      provider: "google",
    };

    // Determine safe redirect target
    let target = new URL("/auth/callback", frontendBase);
    const fromState = state.callbackUrl ? new URL(state.callbackUrl, frontendBase) : null;
    try {
      const allowed = new URL(frontendBase);
      if (fromState && fromState.origin === allowed.origin) {
        target = fromState;
      }
    } catch {
      // ignore parse errors; use default
    }
    target.searchParams.set("token", token);
    target.searchParams.set("user", encodeURIComponent(JSON.stringify(userPayload)));

    try {
      console.log("[auth/callback/google] success", { userId });
    } catch {}

    return NextResponse.redirect(target.toString());
  } catch (err: unknown) {
    try {
      console.error("[auth/callback/google] error", err);
    } catch {}
    const target = new URL("/auth/callback", frontendBase);
    target.searchParams.set("error", "oauth_failed");
    return NextResponse.redirect(target.toString());
  }
}




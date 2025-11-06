import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          ok: false,
          reason: "No DATABASE_URL configured; cannot inspect NextAuth tables.",
          hint: "Set DATABASE_URL and use Prisma adapter for persisted sessions.",
        },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(req.url);
    const raw = searchParams.get("email");
    const email = raw ? raw.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json(
        { ok: false, reason: "Missing ?email=<address> in query string." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
            type: true,
          },
        },
      },
    });

    const userExists = !!user;
    const hasGoogleAccount = !!user?.accounts?.some((a) => a.provider === "google");

    const result = {
      ok: true,
      email,
      userExists,
      hasGoogleAccount,
      userId: user?.id ?? null,
      accounts: user?.accounts ?? [],
      diagnosis:
        userExists && !hasGoogleAccount
          ? "OAuthAccountNotLinked likely: user exists without a linked Google account."
          : userExists && hasGoogleAccount
            ? "User exists and is already linked to Google; issue may be elsewhere (e.g., wrong client, scopes, or callback)."
            : "No user found; first Google sign-in should create user + account rows.",
      recommendation:
        userExists && !hasGoogleAccount
          ? "Prod-safe: implement an account-linking flow. Dev-only: delete the User row (and dependents) for this email and sign in again with Google to create a fresh linked account."
          : "If problem persists, enable NEXTAUTH_DEBUG=true and check logs, and verify GOOGLE_CLIENT_ID/SECRET and NEXTAUTH_URL.",
    } as const;

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}



import GoogleProvider from "next-auth/providers/google";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";

// Optional adapter import (guarded) so build works even if adapter isn't installed/usable
let PrismaAdapterOptional: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  PrismaAdapterOptional = require("@next-auth/prisma-adapter").PrismaAdapter;
} catch {}

export function buildAuthOptions(prismaClient?: any): NextAuthOptions {
  const useDb = !!process.env.DATABASE_URL && !!prismaClient && !!PrismaAdapterOptional;

  return {
    providers: [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      }),
    ],
    // Default to JWT so deploy works even if DB isn’t ready
    session: { strategy: (useDb ? "database" : "jwt") as any },
    ...(useDb ? { adapter: PrismaAdapterOptional!(prismaClient) } : {}),
    callbacks: {
      async session({ session, user, token }: any) {
        if (session?.user) {
          (session.user as any).id = user?.id ?? token?.sub ?? null;
          (session.user as any).role = (user as any)?.role ?? (token as any)?.role ?? null;
        }
        return session;
      },
      async redirect({ url }: { url: string }) {
        // Only allow redirects to FRONTEND_BASE_URL origin
        const fallback = process.env.FRONTEND_BASE_URL || "/";
        try {
          const target = new URL(url, fallback);
          const allowed = new URL(fallback);
          if (target.origin === allowed.origin) {
            return target.toString();
          }
        } catch {
          // fall through
        }
        return fallback;
      },
    },
    pages: {},
  } satisfies NextAuthOptions;
}

// Export a default options object for convenience
export const authOptions = buildAuthOptions(prisma);



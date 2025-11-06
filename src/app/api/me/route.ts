import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = (await getServerSession(authOptions as any)) as any;
  // If DB not configured or no signed-in user, return session and null user gracefully
  if (!process.env.DATABASE_URL || !session?.user?.id) {
    return NextResponse.json({ session, user: null });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { homeownerProfile: true, proProfile: true },
  });
  return NextResponse.json({ session, user });
}



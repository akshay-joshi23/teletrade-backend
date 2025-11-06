import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user || !session.user.id) return NextResponse.json({ session: null });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { homeownerProfile: true, proProfile: true },
  });
  return NextResponse.json({ session, user });
}



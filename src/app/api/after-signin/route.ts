import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  const { searchParams } = new URL(req.url);
  const role = (searchParams.get("role") || "HOMEOWNER").toUpperCase();

  if (!session?.user || !session.user.id) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  const userId = session.user.id as string;

  // Assign role (first login) and upsert corresponding profile
  try {
    await prisma.user.update({ where: { id: userId }, data: { role: role as any } });
  } catch {}

  if (role === "HOMEOWNER") {
    await prisma.homeownerProfile.upsert({ where: { userId }, update: {}, create: { userId } });
  } else if (role === "PRO") {
    await prisma.proProfile.upsert({ where: { userId }, update: {}, create: { userId } });
  }

  return NextResponse.redirect(new URL(`/${role === "PRO" ? "pro" : "homeowner"}`, req.url));
}



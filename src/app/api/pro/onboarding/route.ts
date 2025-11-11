import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { proOnboardingSchema } from "@/lib/validators/pro-onboarding";
import { error, handleCorsPreflight, json } from "@/lib/cors";

function mapSpecialtyToTrade(input: "PLUMBING" | "ELECTRICAL" | "HVAC" | "GENERAL") {
  // Prisma enum uses PLUMBER/ELECTRICIAN/HVAC/GENERAL
  switch (input) {
    case "PLUMBING":
      return "PLUMBER";
    case "ELECTRICAL":
      return "ELECTRICIAN";
    case "HVAC":
      return "HVAC";
    case "GENERAL":
      return "GENERAL";
  }
}

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req) ?? NextResponse.json(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  if (pre) return pre;
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user?.email) {
      return error(req, 401, "Unauthorized");
    }

    const body = await req.json().catch(() => ({}));
    const parsed = proOnboardingSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        req,
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      fullName,
      email: _emailIgnored,
      phone,
      serviceLocation,
      primarySpecialty,
      yearsExperience,
      licenseNumber,
      bio,
    } = parsed.data;

    // Upsert User based on session email (ignore body.email)
    const user = await prisma.user.upsert({
      where: { email: session.user.email as string },
      update: {
        name: fullName,
        phone,
        serviceLocation,
        role: "PRO" as any,
        updatedAt: new Date(),
      },
      create: {
        email: session.user.email as string,
        name: fullName,
        phone,
        serviceLocation,
        role: "PRO" as any,
      },
      select: { id: true, email: true },
    });

    const trade = mapSpecialtyToTrade(primarySpecialty);

    // Upsert ProProfile for this user
    const profile = await prisma.proProfile.upsert({
      where: { userId: user.id },
      update: {
        trade: trade as any,
        yearsExperience: yearsExperience as number,
        licenseNumber: licenseNumber || null,
        bio: bio || null,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        trade: trade as any,
        yearsExperience: yearsExperience as number,
        licenseNumber: licenseNumber || null,
        bio: bio || null,
      },
      select: { userId: true },
    });

    return json(req, { ok: true, userId: user.id, profileId: profile.userId }, { status: 200 });
  } catch (err: unknown) {
    console.error("pro/onboarding error", err);
    return json(req, { error: "Server error" }, { status: 500 });
  }
}




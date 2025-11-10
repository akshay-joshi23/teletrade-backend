import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { error, handleCorsPreflight, json, withCors } from "@/lib/cors";

function mapIncomingTrade(input: string | undefined): "PLUMBER" | "ELECTRICIAN" | "HVAC" | "GENERAL" | null {
  const v = String(input ?? "").trim().toUpperCase();
  if (v === "HVAC") return "HVAC";
  if (v === "GENERAL") return "GENERAL";
  if (v === "PLUMBING" || v === "PLUMBER") return "PLUMBER";
  if (v === "ELECTRICAL" || v === "ELECTRICIAN") return "ELECTRICIAN";
  return null;
}

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req) ?? NextResponse.json(null, { status: 204 });
}

// Create a new homeowner request
export async function POST(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  if (pre) return pre;
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) {
    return error(req, 401, "Unauthorized");
  }

  // Optional role check: only homeowners
  const userId = session.user.id as string;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } }).catch(() => null);
  if (!user || (user.role as any) === "PRO") {
    return error(req, 403, "Only homeowners can create requests");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return error(req, 400, "invalid json");
  }
  const tradeMapped = mapIncomingTrade((body as any)?.trade);
  if (!tradeMapped) {
    return json(req, { error: "Invalid trade" }, { status: 400 });
  }
  const note = (body as any)?.note ? String((body as any)?.note).slice(0, 5000) : null;

  const waitingRoomId = crypto.randomUUID();
  await prisma.request.create({
    data: {
      waitingRoomId,
      status: "OPEN" as any,
      homeownerId: userId,
      trade: tradeMapped as any,
      note,
    },
  });

  return json(req, { waitingRoomId }, { status: 200 });
}



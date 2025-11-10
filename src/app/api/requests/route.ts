import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { error, handleCorsPreflight, json, withCors } from "@/lib/cors";
import { mockStore, type MockJoinRequest } from "@/lib/mockStore";
import { USE_MOCKS } from "@/lib/env";

export const runtime = "nodejs";

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

  // Optional role check: only homeowners
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return error(req, 400, "invalid json");
  }

  // Real backend path (Prisma)
  try {
    if (!USE_MOCKS) {
      if (!session?.user?.id) return error(req, 401, "Unauthorized");
      const userId = session.user.id as string;
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (!user || (user.role as any) === "PRO") {
        return error(req, 403, "Only homeowners can create requests");
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
  } catch {
    // fall through to mock
  }

  // Mock fallback
  const trade = String((body as any)?.trade ?? "");
  if (!trade) return json(req, { error: "trade required" }, { status: 400 });
  const waitingRoomId = crypto.randomUUID();
  const now = Date.now();
  const homeownerId = (session?.user?.id as string) || (body as any)?.homeownerId || "mock-homeowner";
  const mock: MockJoinRequest = {
    id: waitingRoomId,
    homeownerId,
    trade: trade as any,
    note: (body as any)?.note,
    status: "OPEN",
    createdAt: now,
    updatedAt: now,
  };
  mockStore.joinRequests.set(waitingRoomId, mock);
  return json(req, { waitingRoomId }, { status: 201 });
}

// List open requests (optional trade filter)
export async function GET(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  if (pre) return pre;
  const url = new URL(req.url);
  const trade = url.searchParams.get("trade");

  try {
    if (!USE_MOCKS) {
      const where: any = { status: "OPEN" };
      if (trade) {
        const mapped = mapIncomingTrade(trade);
        if (!mapped) return json(req, { error: "Invalid trade" }, { status: 400 });
        where.trade = mapped;
      }
      const rows = await prisma.request.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: { waitingRoomId: true, trade: true, note: true, createdAt: true },
      });
      const data = rows.map((r) => ({
        id: r.waitingRoomId,
        trade: r.trade,
        note: r.note,
        createdAt: r.createdAt.getTime(),
      }));
      return json(req, data, { status: 200 });
    }
  } catch {
    // fall back to mock
  }

  const rows = [...mockStore.joinRequests.values()]
    .filter((r) => r.status === "OPEN" && (!trade || r.trade === trade))
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((r) => ({ id: r.id, trade: r.trade, note: r.note, createdAt: r.createdAt }));
  return json(req, rows, { status: 200 });
}



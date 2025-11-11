import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { error, handleCorsPreflight, json, withCors } from "@/lib/cors";
import { mockStore, type MockJoinRequest } from "@/lib/mockStore";
import { USE_MOCKS } from "@/lib/env";
import { z } from "zod";

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
  const body = await req.json().catch(() => ({}));
  const schema = z.object({
    trade: z.enum(["PLUMBING", "ELECTRICAL", "HVAC", "GENERAL"]),
    note: z.string().max(5000).optional(),
  });
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return json(req, { error: "Invalid input", issues: parsed.error.issues }, { status: 422 });
  }

  // Real backend path (Prisma)
  try {
    if (!USE_MOCKS) {
      // Public: derive homeowner id from anonymous session cookie or random
      const cookieId = req.cookies.get("tt_session")?.value;
      const userId = cookieId ?? crypto.randomUUID();
      const tradeMapped = mapIncomingTrade(parsed.data.trade);
      if (!tradeMapped) {
        return json(req, { error: "Invalid trade" }, { status: 400 });
      }
      const note = parsed.data.note ?? null;

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
  const waitingRoomId = crypto.randomUUID();
  const now = Date.now();
  const homeownerId = req.cookies.get("tt_session")?.value || "mock-homeowner";
  const mock: MockJoinRequest = {
    id: waitingRoomId,
    homeownerId,
    trade: parsed.success ? (parsed.data.trade as any) : "GENERAL",
    note: parsed.success ? parsed.data.note : undefined,
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



import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleCorsPreflight, json, error } from "@/lib/cors";
import { createLiveKitRoomIfNeeded } from "@/lib/livekit";
import { USE_MOCKS } from "@/lib/env";
import { mockStore } from "@/lib/mockStore";

export const runtime = "nodejs";

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req) ?? NextResponse.json(null, { status: 204 });
}

export async function POST(req: NextRequest, ctx: { params: { waitingRoomId: string } }) {
  const pre = handleCorsPreflight(req);
  if (pre) return pre;
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) {
    return error(req, 401, "Unauthorized");
  }
  const proId = session.user.id as string;
  const role = (session.user as any)?.role;
  if (role && role !== "PRO") {
    return error(req, 403, "Only pros can admit");
  }
  const waitingRoomId = ctx.params.waitingRoomId;
  if (!waitingRoomId) {
    return error(req, 400, "invalid waitingRoomId");
  }

  const roomId = `pro_${proId}`;

  if (!USE_MOCKS) {
    // Enforce single-admit via updateMany guard on OPEN status
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.request.updateMany({
        where: { waitingRoomId, status: "OPEN" as any },
        data: { status: "ADMITTED" as any, proId, roomId },
      });
      if (updated.count === 0) {
        // Read current to decide 404 vs 409
        const existing = await tx.request.findUnique({ where: { waitingRoomId }, select: { status: true } });
        if (!existing) return { type: "not_found" } as const;
        return { type: "conflict" } as const;
      }
      return { type: "ok" } as const;
    });

    if (result.type === "not_found") {
      return error(req, 404, "not found");
    }
    if (result.type === "conflict") {
      return json(req, { error: "already admitted" }, { status: 409 });
    }
  } else {
    const existing = mockStore.joinRequests.get(waitingRoomId);
    if (!existing) return error(req, 404, "not found");
    if (existing.status !== "OPEN") return json(req, { error: "already admitted" }, { status: 409 });
    existing.status = "ADMITTED";
    existing.proId = proId;
    existing.roomId = roomId;
    existing.updatedAt = Date.now();
    mockStore.joinRequests.set(waitingRoomId, existing);
  }

  // Ensure LiveKit room exists
  try {
    await createLiveKitRoomIfNeeded(roomId);
  } catch {
    // continue; client can still attempt join
  }

  return json(req, { roomId }, { status: 200 });
}



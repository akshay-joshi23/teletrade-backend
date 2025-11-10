import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleCorsPreflight, json, withCors, error } from "@/lib/cors";
import { USE_MOCKS } from "@/lib/env";
import { mockStore } from "@/lib/mockStore";

export const runtime = "nodejs";

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req) ?? NextResponse.json(null, { status: 204 });
}

export async function GET(req: NextRequest, ctx: { params: { waitingRoomId: string } }) {
  const pre = handleCorsPreflight(req);
  if (pre) return pre;
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id && !USE_MOCKS) return error(req, 401, "Unauthorized");
  const waitingRoomId = ctx.params.waitingRoomId;
  if (!waitingRoomId) {
    return error(req, 400, "invalid waitingRoomId");
  }
  try {
    if (!USE_MOCKS) {
      const request = await prisma.request.findUnique({ where: { waitingRoomId } });
      if (!request) return error(req, 404, "not found");
      return json(req, {
        status: request.status,
        roomId: request.roomId ?? null,
        proId: request.proId ?? null,
      });
    }
  } catch {
    // fallthrough to mock
  }
  const mock = mockStore.joinRequests.get(waitingRoomId);
  if (!mock) return error(req, 404, "not found");
  return json(req, { status: mock.status, roomId: mock.roomId ?? null, proId: mock.proId ?? null });
}



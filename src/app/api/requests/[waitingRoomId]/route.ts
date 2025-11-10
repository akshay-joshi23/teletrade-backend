import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleCorsPreflight, json, withCors, error } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req) ?? NextResponse.json(null, { status: 204 });
}

export async function GET(req: NextRequest, ctx: { params: { waitingRoomId: string } }) {
  const pre = handleCorsPreflight(req);
  if (pre) return pre;
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) {
    return error(req, 401, "Unauthorized");
  }
  const waitingRoomId = ctx.params.waitingRoomId;
  if (!waitingRoomId) {
    return error(req, 400, "invalid waitingRoomId");
  }
  const request = await prisma.request.findUnique({ where: { waitingRoomId } });
  if (!request) {
    return error(req, 404, "not found");
  }
  // Allow homeowner or pro to view; in real world you’d restrict further
  return json(req, {
    status: request.status,
    roomId: request.roomId ?? null,
    proId: request.proId ?? null,
  });
}



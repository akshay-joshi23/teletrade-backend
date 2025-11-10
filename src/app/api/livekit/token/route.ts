import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { handleCorsPreflight, withCors } from "@/lib/cors";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureLiveKitEnv, generateJoinToken } from "@/lib/livekit";
import { USE_MOCKS } from "@/lib/env";
import { mockStore } from "@/lib/mockStore";

const ROOM_RE = /^[A-Za-z0-9_-]{1,128}$/;

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  if (pre) return pre;
  const { url } = ensureLiveKitEnv();

  // Auth required
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) {
    return withCors(req, NextResponse.json({ message: "Unauthorized" }, { status: 401 }));
  }
  const userId = session.user.id as string;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return withCors(req, NextResponse.json({ message: "invalid json" }, { status: 400 }));
  }
  const { roomId, role } = (body ?? {}) as { roomId?: string; role?: "HOMEOWNER" | "PRO" };
  if (!roomId || !ROOM_RE.test(roomId)) {
    return withCors(req, NextResponse.json({ message: "invalid roomId" }, { status: 400 }));
  }

  // Verify role constraints
  const normalizedRole = String(role ?? "").toUpperCase();
  if (normalizedRole !== "HOMEOWNER" && normalizedRole !== "PRO") {
    return withCors(req, NextResponse.json({ message: "invalid role" }, { status: 400 }));
  }

  if (normalizedRole === "PRO") {
    const expected = `pro_${userId}`;
    if (roomId !== expected) {
      return withCors(req, NextResponse.json({ message: "forbidden: roomId mismatch" }, { status: 403 }));
    }
  } else {
    // HOMEOWNER must have an ADMITTED request with matching roomId
    if (!USE_MOCKS) {
      const admitted = await prisma.request.findFirst({
        where: { homeownerId: userId, status: "ADMITTED" as any, roomId },
        select: { id: true },
      });
      if (!admitted) {
        return withCors(req, NextResponse.json({ message: "forbidden: not admitted" }, { status: 403 }));
      }
    } else {
      const admitted = [...mockStore.joinRequests.values()].some(
        (r) => r.homeownerId === userId && r.status === "ADMITTED" && r.roomId === roomId,
      );
      if (!admitted) {
        return withCors(req, NextResponse.json({ message: "forbidden: not admitted" }, { status: 403 }));
      }
    }
  }

  const identityPrefix = normalizedRole === "PRO" ? "PRO" : "HO";
  const identity = `${identityPrefix}-${userId}`;
  const token = generateJoinToken({
    roomId,
    identity,
    name: (session.user.name as string) || identity,
    canPublish: true,
    canSubscribe: true,
  } as any);

  return withCors(req, NextResponse.json({ token, url }, { status: 200 }));
}

export async function OPTIONS(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  return pre ?? NextResponse.json(null, { status: 204 });
}


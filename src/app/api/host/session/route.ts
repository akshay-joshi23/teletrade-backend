import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { handleCorsPreflight, json, error } from "@/lib/cors";
import { createLiveKitRoomIfNeeded, ensureLiveKitEnv, generateJoinToken } from "@/lib/livekit";

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req) ?? NextResponse.json(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  if (pre) return pre;
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) {
    return error(req, 401, "Unauthorized");
  }
  const userId = session.user.id as string;
  // require PRO
  // Load from DB would be stronger; we trust session.role if present
  const role = (session.user as any)?.role;
  if (role && role !== "PRO") {
    return error(req, 403, "Only pros can start a host session");
  }

  const roomId = `pro_${userId}`;
  try {
    await createLiveKitRoomIfNeeded(roomId);
  } catch (e) {
    return json(req, { error: "LiveKit room creation failed", details: (e as any)?.message ?? String(e) }, { status: 500 });
  }

  // Mint host/admin token
  const token = generateJoinToken({
    roomId,
    identity: `PRO-${userId}`,
    name: session.user.name || `Pro ${userId.slice(-4)}`,
    // host privileges
    canPublish: true,
    canSubscribe: true,
    roomAdmin: true,
  } as any);

  return json(req, { roomId, hostToken: token }, { status: 200 });
}



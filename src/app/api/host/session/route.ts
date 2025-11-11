import { NextRequest, NextResponse } from "next/server";
import { handleCorsPreflight, json } from "@/lib/cors";
import { createLiveKitRoomIfNeeded, ensureLiveKitEnv, generateJoinToken } from "@/lib/livekit";
import { USE_MOCKS } from "@/lib/env";
import { mockStore, type MockHostSession } from "@/lib/mockStore";
import crypto from "crypto";
import { z } from "zod";

export const runtime = "nodejs";

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req) ?? NextResponse.json(null, { status: 204 });
}

export async function POST(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  if (pre) return pre;
  // Temporary: allow unauthenticated usage for connectivity testing
  // Prefer provided header, else fixed fallback
  const userId = (req.headers.get("x-pro-id") || "public-pro").trim();
  const schema = z.object({
    role: z.string().optional(),
    roomName: z.string().min(1).max(128).optional(),
  });
  let parsed: z.infer<typeof schema> | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    const r = schema.safeParse(body);
    if (!r.success) {
      return json(req, { error: "Invalid host session payload", issues: r.error.issues }, { status: 422 });
    }
    parsed = r.data;
  } catch {
    // ignore, parsed remains null
  }
  // Log minimal diagnostics (no secrets)
  try {
    console.log("[host/session] request", {
      userId,
      body: parsed,
      mock: USE_MOCKS,
    });
  } catch {}

  const roomId = parsed?.roomName || `pro_${userId}`;
  if (!USE_MOCKS) {
    try {
      await createLiveKitRoomIfNeeded(roomId);
    } catch (e) {
      return json(req, { error: "LiveKit room creation failed", details: (e as any)?.message ?? String(e) }, { status: 500 });
    }
  } else {
    const sessionRow: MockHostSession = {
      id: roomId,
      proId: userId,
      trade: "GENERAL",
      status: "LIVE",
      createdAt: Date.now(),
    };
    mockStore.hostSessions.set(roomId, sessionRow);
  }

  // Mint host/admin token
  const token = generateJoinToken({
    roomId,
    identity: `PRO-${userId}`,
    name: `Pro ${userId.slice(-4)}`,
    // host privileges
    canPublish: true,
    canSubscribe: true,
    roomAdmin: true,
  } as any);

  return json(req, { roomId, hostToken: token }, { status: 200 });
}



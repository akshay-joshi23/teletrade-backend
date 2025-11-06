import { NextRequest, NextResponse } from "next/server";
import { handleCorsPreflight, withCors } from "@/lib/cors";
import { getPairByRoomId, getPairForSession } from "@/lib/match";
import { getOutcome } from "@/lib/outcomes";

const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const pre = handleCorsPreflight(req);
  if (pre) return pre;
  const id = ctx.params.id;
  if (!id || !ID_RE.test(id)) {
    return withCors(req, NextResponse.json({ message: "invalid id" }, { status: 400 }));
  }

  // 1) Try as roomId
  const byRoom = getPairByRoomId(id);
  if (byRoom) {
    const outcome = getOutcome(byRoom.roomId);
    const payload: any = {
      id: byRoom.roomId,
      status: "ACTIVE",
      participants: 2,
    };
    if (outcome) {
      payload.summary = { outcome: outcome.outcome, notes: outcome.notes ?? null, createdAt: outcome.createdAt };
    }
    return withCors(req, NextResponse.json(payload, { status: 200 }));
  }

  // 2) Try as sessionId token (pre-pairing handle)
  const bySession = getPairForSession(id);
  if (bySession) {
    const outcome = getOutcome(bySession.roomId);
    const payload: any = {
      id: bySession.roomId,
      status: "ACTIVE",
      participants: 2,
    };
    if (outcome) {
      payload.summary = { outcome: outcome.outcome, notes: outcome.notes ?? null, createdAt: outcome.createdAt };
    }
    return withCors(req, NextResponse.json(payload, { status: 200 }));
  }

  // 3) Pending
  return withCors(req, NextResponse.json({ id, status: "PENDING" }, { status: 200 }));
}

export async function OPTIONS(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  return pre ?? NextResponse.json(null, { status: 204 });
}



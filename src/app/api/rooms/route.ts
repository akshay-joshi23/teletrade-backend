import { NextRequest, NextResponse } from "next/server";
import { handleCorsPreflight, withCors } from "@/lib/cors";
import { enqueue, poll, type Role } from "@/lib/match";
import { type Trade } from "@/lib/types";

export async function POST(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  if (pre) return pre;
  const sessionId = req.cookies.get("tt_session")?.value;
  if (!sessionId) return withCors(req, NextResponse.json({ message: "missing session" }, { status: 400 }));
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return withCors(req, NextResponse.json({ message: "invalid json" }, { status: 400 }));
  }
  const { role, trade } = (body ?? {}) as { role?: Role; trade?: Trade };
  if (role !== "homeowner" && role !== "pro") {
    return withCors(req, NextResponse.json({ message: "invalid role" }, { status: 400 }));
  }
  if (!trade) {
    return withCors(req, NextResponse.json({ message: "invalid trade" }, { status: 400 }));
  }
  const result = enqueue(role, trade, sessionId);
  if (result.status === "paired") {
    const p = poll(sessionId);
    if (p.status === "paired" && p.roomId) {
      return withCors(req, NextResponse.json({ id: p.roomId, status: "ACTIVE" }, { status: 200 }));
    }
  }
  return withCors(req, NextResponse.json({ id: sessionId, status: "PENDING" }, { status: 200 }));
}

export async function OPTIONS(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  return pre ?? NextResponse.json(null, { status: 204 });
}



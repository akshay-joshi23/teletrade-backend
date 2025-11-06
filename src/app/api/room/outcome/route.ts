import { NextRequest, NextResponse } from "next/server";
import { saveOutcome, type OutcomeType } from "@/lib/outcomes";
import { getPairForSession } from "@/lib/match";

const ROOM_RE = /^[A-Za-z0-9_-]{1,64}$/;
const OUTCOMES: OutcomeType[] = ["resolved_remote", "needs_in_person", "parts_required"];

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get("tt_session")?.value || "";
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "invalid json" }, { status: 400 });
  }
  const { roomId, outcome, notes } = (body ?? {}) as { roomId?: string; outcome?: OutcomeType; notes?: string };
  if (!sessionId) return NextResponse.json({ message: "missing session" }, { status: 400 });
  if (!roomId || !ROOM_RE.test(roomId)) return NextResponse.json({ message: "invalid roomId" }, { status: 400 });
  if (!outcome || !OUTCOMES.includes(outcome)) return NextResponse.json({ message: "invalid outcome" }, { status: 400 });

  const pair = getPairForSession(sessionId);
  if (!pair) return NextResponse.json({ message: "not paired" }, { status: 400 });
  if (pair.roomId !== roomId) return NextResponse.json({ message: "room mismatch" }, { status: 400 });

  const other = pair.a === sessionId ? pair.b : pair.a;
  const trimmedNotes = notes?.slice(0, 2000);

  saveOutcome({
    roomId,
    trade: pair.trade,
    proSessionId: sessionId,
    homeownerSessionId: other,
    outcome,
    notes: trimmedNotes,
    createdAt: Date.now(),
  });
  return NextResponse.json({ ok: true }, { status: 200 });
}



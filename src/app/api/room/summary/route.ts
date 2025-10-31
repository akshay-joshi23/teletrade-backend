import { NextRequest, NextResponse } from "next/server";
import { getOutcome } from "@/lib/outcomes";

const ROOM_RE = /^[A-Za-z0-9_-]{1,64}$/;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId") || undefined;
  if (!roomId || !ROOM_RE.test(roomId)) return NextResponse.json({ message: "invalid roomId" }, { status: 400 });
  const outcome = getOutcome(roomId);
  if (!outcome) return NextResponse.json({ message: "not found" }, { status: 404 });
  return NextResponse.json({ outcome }, { status: 200 });
}



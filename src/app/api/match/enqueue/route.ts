import { NextRequest, NextResponse } from "next/server";
import { enqueue, type Role } from "@/lib/match";
import { type Trade } from "@/lib/types";

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get("tt_session")?.value;
  if (!sessionId) return NextResponse.json({ message: "missing session" }, { status: 400 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "invalid json" }, { status: 400 });
  }
  const { role, trade } = (body ?? {}) as { role?: Role; trade?: Trade };
  if (role !== "homeowner" && role !== "pro") return NextResponse.json({ message: "invalid role" }, { status: 400 });
  if (!trade) return NextResponse.json({ message: "invalid trade" }, { status: 400 });

  const result = enqueue(role, trade, sessionId);
  return NextResponse.json(result, { status: 200 });
}



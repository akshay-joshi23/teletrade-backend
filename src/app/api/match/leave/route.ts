import { NextRequest, NextResponse } from "next/server";
import { leave, type Role } from "@/lib/match";
import { type Trade } from "@/lib/types";

export async function POST(req: NextRequest) {
  const sessionId = req.cookies.get("tt_session")?.value;
  if (!sessionId) return NextResponse.json({ message: "missing session" }, { status: 400 });
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // allow empty body
  }
  const { role, trade } = (body ?? {}) as { role?: Role; trade?: Trade };
  const result = leave(role, trade, sessionId);
  return NextResponse.json(result, { status: 200 });
}



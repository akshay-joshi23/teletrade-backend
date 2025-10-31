import { NextRequest, NextResponse } from "next/server";
import { poll } from "@/lib/match";

export async function GET(req: NextRequest) {
  const sessionId = req.cookies.get("tt_session")?.value;
  if (!sessionId) return NextResponse.json({ message: "missing session" }, { status: 400 });
  const result = poll(sessionId);
  return NextResponse.json(result, { status: 200 });
}



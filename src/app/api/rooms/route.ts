import { NextRequest, NextResponse } from "next/server";
import { handleCorsPreflight, withCors } from "@/lib/cors";
import { enqueue, poll, type Role } from "@/lib/match";
import { type Trade } from "@/lib/types";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  if (pre) return pre;
  let sessionId = req.cookies.get("tt_session")?.value;
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
  // Generate a session id if missing to avoid 400 on first cross-origin call
  const needSetCookie = !sessionId;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }
  const result = enqueue(role, trade, sessionId);
  if (result.status === "paired") {
    const p = poll(sessionId);
    if (p.status === "paired" && p.roomId) {
      const res = NextResponse.json({ id: p.roomId, status: "ACTIVE" }, { status: 200 });
      // Set cookie only when we generated a fresh one
      if (needSetCookie) {
        try {
          const requestOrigin = req.headers.get("origin");
          const allowed = process.env.ALLOWED_ORIGIN || "";
          let sameSite: "lax" | "none" = "lax";
          let secure = false;
          if (requestOrigin && allowed) {
            const reqUrl = new URL(requestOrigin);
            const allowedUrl = new URL(allowed);
            if (reqUrl.origin === allowedUrl.origin) {
              sameSite = "none";
              secure = true;
            }
          }
          res.cookies.set({
            name: "tt_session",
            value: sessionId,
            path: "/",
            httpOnly: true,
            sameSite,
            secure,
            maxAge: 60 * 60 * 24 * 30,
          });
        } catch {}
      }
      return withCors(req, res);
    }
  }
  const res = NextResponse.json({ id: sessionId, status: "PENDING" }, { status: 200 });
  if (needSetCookie) {
    try {
      const requestOrigin = req.headers.get("origin");
      const allowed = process.env.ALLOWED_ORIGIN || "";
      let sameSite: "lax" | "none" = "lax";
      let secure = false;
      if (requestOrigin && allowed) {
        const reqUrl = new URL(requestOrigin);
        const allowedUrl = new URL(allowed);
        if (reqUrl.origin === allowedUrl.origin) {
          sameSite = "none";
          secure = true;
        }
      }
      res.cookies.set({
        name: "tt_session",
        value: sessionId,
        path: "/",
        httpOnly: true,
        sameSite,
        secure,
        maxAge: 60 * 60 * 24 * 30,
      });
    } catch {}
  }
  return withCors(req, res);
}

export async function OPTIONS(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  return pre ?? NextResponse.json(null, { status: 204 });
}



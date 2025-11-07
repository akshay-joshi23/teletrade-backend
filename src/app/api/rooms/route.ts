import { NextRequest, NextResponse } from "next/server";
import { handleCorsPreflight, withCors } from "@/lib/cors";
import { enqueue, poll, type Role } from "@/lib/match";
import { type Trade } from "@/lib/types";
import crypto from "crypto";
import { json, error } from "@/lib/cors";

export async function POST(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  if (pre) return pre;
  let sessionId = req.cookies.get("tt_session")?.value;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return error(req, 400, "invalid json");
  }
  const { role, trade } = (body ?? {}) as { role?: string; trade?: Trade };
  const R = String(role ?? "").trim().toUpperCase();
  if (R !== "HOMEOWNER" && R !== "PRO") {
    return error(req, 400, "role must be HOMEOWNER or PRO");
  }
  const normalizedRole: Role = R === "PRO" ? "pro" : "homeowner";
  if (!trade) {
    return error(req, 400, "invalid trade");
  }
  // Generate a session id if missing to avoid 400 on first cross-origin call
  const needSetCookie = !sessionId;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }
  const result = enqueue(normalizedRole, trade, sessionId);
  if (result.status === "paired") {
    const p = poll(sessionId);
    if (p.status === "paired" && p.roomId) {
      const res = json(req, { id: p.roomId, status: "ACTIVE" }, { status: 200 });
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
      return res;
    }
  }
  const res = json(req, { id: sessionId, status: "PENDING" }, { status: 200 });
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
  return res;
}

export async function OPTIONS(req: NextRequest) {
  const pre = handleCorsPreflight(req);
  return pre ?? NextResponse.json(null, { status: 204 });
}



import { NextRequest, NextResponse } from "next/server";
import { handleCorsPreflight, withCors } from "@/lib/cors";
import { enqueue, poll, type Role } from "@/lib/match";
import { type Trade } from "@/lib/types";
import crypto from "crypto";
import { json, error } from "@/lib/cors";
import { prisma } from "@/lib/prisma";
import { createLiveKitRoomIfNeeded, newRoomId } from "@/lib/livekit";

// Normalize role input to canonical "HOMEOWNER" | "PRO"
function normalizeRole(input: unknown): "HOMEOWNER" | "PRO" | null {
  const raw = String(input ?? "").trim().toUpperCase();

  if (raw === "HOMEOWNER" || raw === "PRO") return raw as "HOMEOWNER" | "PRO";

  const aliases: Record<string, "HOMEOWNER" | "PRO"> = {
    HOME_OWNER: "HOMEOWNER",
    CLIENT: "HOMEOWNER",
    CUSTOMER: "HOMEOWNER",

    PROFESSIONAL: "PRO",
    EXPERT: "PRO",
    TRADESPERSON: "PRO",
    TRADESMAN: "PRO",
    TECH: "PRO",
  };

  return aliases[raw] ?? null;
}

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

  // New contract: explicit room creation with participants (non-breaking; falls back to matcher if absent)
  const {
    homeownerId,
    homeownerName,
    professionalId,
    professionalName,
    issueType,
  } = (body ?? {}) as {
    homeownerId?: string;
    homeownerName?: string;
    professionalId?: string;
    professionalName?: string;
    issueType?: string;
  };

  if (homeownerId && professionalId) {
    // Validate LiveKit envs and create a room id
    const roomId = newRoomId();
    try {
      await createLiveKitRoomIfNeeded(roomId);
    } catch (e) {
      return withCors(
        req,
        NextResponse.json(
          { error: "Failed to create LiveKit room", details: (e as Error)?.message ?? String(e) },
          { status: 500 },
        ),
      );
    }

    // Persist to DB (best effort)
    try {
      await prisma.room.create({
        data: {
          livekitRoom: roomId,
          status: "ACTIVE",
          homeownerId,
          proId: professionalId,
        },
      });
    } catch {
      // continue without failing the request
    }

    // Response per requested shape
    return json(req, {
      id: roomId,
      homeownerId,
      professionalId,
      issueType: issueType ?? null,
      status: "active",
      createdAt: new Date().toISOString(),
    });
  }

  // Existing matcher-based flow (backward compatible)
  const { trade } = (body ?? {}) as { role?: string; trade?: Trade };
  // Accept role from multiple keys; prefer "role"
  const rawRole =
    (body as any)?.role ??
    (body as any)?.userRole ??
    (body as any)?.user_type ??
    (body as any)?.type ??
    (body as any)?.who;

  const canonical = normalizeRole(rawRole);
  if (!canonical) {
    return json(
      req,
      {
        error: "Invalid role. Use HOMEOWNER or PRO.",
        received: rawRole ?? null,
        accepted: ["HOMEOWNER", "PRO"],
      },
      { status: 400 },
    );
  }
  const normalizedRole: Role = canonical === "PRO" ? "pro" : "homeowner";
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



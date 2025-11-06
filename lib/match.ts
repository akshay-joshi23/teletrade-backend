import { TRADES, type Trade } from "./types";

export type Role = "homeowner" | "pro";
export type SessionId = string;

type Queue = { homeowners: SessionId[]; pros: SessionId[] };
export type Pair = { roomId: string; a: SessionId; b: SessionId; trade: Trade; createdAt: number };

const queues = new Map<Trade, Queue>();
for (const t of TRADES) queues.set(t, { homeowners: [], pros: [] });

const pairsBySession = new Map<SessionId, Pair>();

export function enqueue(role: Role, trade: Trade, sessionId: SessionId) {
  if (pairsBySession.has(sessionId)) return { status: "paired" as const };
  const q = queues.get(trade)!;
  removeFromQueues(sessionId);

  if (role === "homeowner") {
    if (q.pros.length > 0) {
      const pro = q.pros.shift()!;
      pair(trade, sessionId, pro);
      return { status: "paired" as const };
    }
    q.homeowners.push(sessionId);
    return { status: "queued" as const };
  } else {
    if (q.homeowners.length > 0) {
      const ho = q.homeowners.shift()!;
      pair(trade, ho, sessionId);
      return { status: "paired" as const };
    }
    q.pros.push(sessionId);
    return { status: "queued" as const };
  }
}

export function leave(_role: Role | undefined, _trade: Trade | undefined, sessionId: SessionId) {
  removeFromQueues(sessionId);
  return { ok: true };
}

export function poll(sessionId: SessionId) {
  const p = pairsBySession.get(sessionId);
  if (!p) return { status: "waiting" as const };
  return { status: "paired" as const, roomId: p.roomId, trade: p.trade };
}

function pair(trade: Trade, a: SessionId, b: SessionId) {
  const roomId = crypto.randomUUID();
  const p: Pair = { roomId, a, b, trade, createdAt: Date.now() };
  pairsBySession.set(a, p);
  pairsBySession.set(b, p);
}

function removeFromQueues(sessionId: SessionId) {
  for (const q of queues.values()) {
    q.homeowners = q.homeowners.filter((id) => id !== sessionId);
    q.pros = q.pros.filter((id) => id !== sessionId);
  }
}

export function clearPair(sessionId: SessionId) {
  const p = pairsBySession.get(sessionId);
  if (!p) return;
  pairsBySession.delete(p.a);
  pairsBySession.delete(p.b);
}

export function getPairForSession(sessionId: SessionId): Pair | null {
  return pairsBySession.get(sessionId) ?? null;
}



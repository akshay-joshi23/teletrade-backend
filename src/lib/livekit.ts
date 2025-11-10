import crypto from "crypto";

type JwtHeader = { alg: "HS256"; typ: "JWT" };

function b64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function signHS256(header: JwtHeader, payload: Record<string, unknown>, secret: string) {
  const headerB64 = b64url(JSON.stringify(header));
  const payloadB64 = b64url(JSON.stringify(payload));
  const data = `${headerB64}.${payloadB64}`;
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${data}.${sig}`;
}

function wsToHttp(url: string) {
  try {
    const u = new URL(url);
    if (u.protocol === "wss:") u.protocol = "https:";
    if (u.protocol === "ws:") u.protocol = "http:";
    return u.toString().replace(/\/+$/, "");
  } catch {
    return url;
  }
}

export function ensureLiveKitEnv() {
  const url = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!url || !apiKey || !apiSecret) {
    throw new Error("LiveKit env not configured");
  }
  return { url, apiKey, apiSecret };
}

export async function createLiveKitRoomIfNeeded(roomName: string) {
  const { url, apiKey, apiSecret } = ensureLiveKitEnv();
  const httpBase = wsToHttp(url);

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60; // short-lived server auth
  const header: JwtHeader = { alg: "HS256", typ: "JWT" };
  const payload = {
    iss: apiKey,
    iat: now,
    exp,
    // minimal server-side grant for room creation
    video: { roomCreate: true },
  };
  const bearer = signHS256(header, payload, apiSecret);

  const res = await fetch(`${httpBase}/twirp/livekit.RoomService/CreateRoom`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${bearer}`,
    },
    body: JSON.stringify({
      name: roomName,
      max_participants: 2,
      empty_timeout: 3600,
    }),
  });

  // 200 OK room created, 409 already exists (depending on server); tolerate non-2xx if indicates exists
  if (!res.ok) {
    // Best-effort tolerance: if server says already exists or similar, we ignore.
    // We won't throw to avoid blocking call flows when creation is implicit on join.
    try {
      const err = await res.json().catch(() => null);
      const msg = (err && (err.msg || err.message)) || "";
      const already = String(msg).toLowerCase().includes("exist");
      if (!already) {
        // not an "already exists" case; throw for visibility to caller
        throw new Error(`CreateRoom failed: ${res.status} ${res.statusText} ${msg}`);
      }
    } catch (e) {
      throw e instanceof Error ? e : new Error("CreateRoom failed");
    }
  }
}

export function generateJoinToken(params: {
  roomId: string;
  identity: string;
  name?: string;
  canPublish?: boolean;
  canSubscribe?: boolean;
  canPublishData?: boolean;
  roomAdmin?: boolean;
}) {
  const { roomId, identity, name } = params;
  const { apiKey, apiSecret } = ensureLiveKitEnv();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 60 * 60; // 1 hour
  const header: JwtHeader = { alg: "HS256", typ: "JWT" };
  const payload = {
    iss: apiKey,
    iat: now,
    exp,
    sub: identity,
    name: name || identity,
    video: {
      room: roomId,
      roomJoin: true,
      canPublish: params.canPublish ?? true,
      canSubscribe: params.canSubscribe ?? true,
      canPublishData: params.canPublishData ?? true,
      roomAdmin: params.roomAdmin ?? false,
    },
  };
  return signHS256(header, payload, apiSecret);
}

export function newRoomId(prefix = "room") {
  return `${prefix}-${crypto.randomUUID()}`;
}



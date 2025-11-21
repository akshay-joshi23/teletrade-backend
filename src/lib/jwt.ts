import crypto from "crypto";

function b64url(input: Buffer | string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function signJwt(payload: Record<string, unknown>, secret: string, opts?: { expSeconds?: number; subject?: string }) {
  const now = Math.floor(Date.now() / 1000);
  const exp = opts?.expSeconds ? now + opts.expSeconds : undefined;
  const header = { alg: "HS256", typ: "JWT" };
  const body: Record<string, unknown> = { iat: now, ...payload };
  if (typeof exp === "number") body.exp = exp;
  if (opts?.subject) body.sub = opts.subject;

  const headerB64 = b64url(JSON.stringify(header));
  const payloadB64 = b64url(JSON.stringify(body));
  const data = `${headerB64}.${payloadB64}`;
  const sig = crypto.createHmac("sha256", secret).update(data).digest("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${data}.${sig}`;
}




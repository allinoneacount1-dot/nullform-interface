import { createHmac, timingSafeEqual } from "node:crypto";

// Shared HMAC-cookie session verifier. Mirrors the token format produced by
// src/lib/auth.functions.ts (`signSession`) so the /api/purge route can
// authenticate the caller without re-implementing the SIWS handshake.
export function verifyNullSession(
  token: string | undefined,
): { pubkey: string; iat: number; exp: number } | null {
  if (!token) return null;
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (typeof payload.pubkey !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}

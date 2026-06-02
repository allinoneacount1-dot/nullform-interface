import { createServerFn } from "./react-start-stub";
import { getCookie, setCookie, deleteCookie } from "./react-start-stub";
import { z } from "zod";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// In-memory nonce store. Single-worker only; replace with Redis for
// horizontal scale. TTL: 5 minutes.
const NONCE_TTL_MS = 5 * 60 * 1000;
const nonces = new Map<string, { value: string; expires: number }>();

function gcNonces() {
  const now = Date.now();
  for (const [k, v] of nonces) if (v.expires < now) nonces.delete(k);
}

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET missing or too short");
  return s;
}

function signSession(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function verifySession(token: string): { pubkey: string; iat: number; exp: number } | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", getSecret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export const getAuthNonce = createServerFn({ method: "POST" })
  .inputValidator(z.object({ pubkey: z.string().min(32).max(64) }))
  .handler(async ({ data }) => {
    gcNonces();
    const value = randomBytes(24).toString("hex");
    nonces.set(data.pubkey, { value, expires: Date.now() + NONCE_TTL_MS });
    const message =
      `NULL_FORM // SYS_AUTH\n` +
      `protocol: SIWS-v1\n` +
      `wallet: ${data.pubkey}\n` +
      `nonce: ${value}\n` +
      `issued: ${new Date().toISOString()}\n` +
      `intent: confirm-you-are-nothing`;
    return { message, nonce: value };
  });

export const verifyAuthSignature = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      pubkey: z.string().min(32).max(64),
      signature: z.string().min(40).max(200), // base58
      message: z.string().min(40).max(1024),
    }),
  )
  .handler(async ({ data }) => {
    gcNonces();
    const rec = nonces.get(data.pubkey);
    if (!rec) throw new Error("nonce_expired_or_missing");
    if (!data.message.includes(`nonce: ${rec.value}`)) throw new Error("nonce_mismatch");
    if (!data.message.includes(`wallet: ${data.pubkey}`)) throw new Error("wallet_mismatch");

    let pkBytes: Uint8Array;
    let sigBytes: Uint8Array;
    try {
      pkBytes = bs58.decode(data.pubkey);
      sigBytes = bs58.decode(data.signature);
    } catch {
      throw new Error("bad_encoding");
    }
    if (pkBytes.length !== 32 || sigBytes.length !== 64) throw new Error("bad_key_or_sig_length");

    const ok = nacl.sign.detached.verify(new TextEncoder().encode(data.message), sigBytes, pkBytes);
    if (!ok) throw new Error("invalid_signature");

    nonces.delete(data.pubkey);

    const now = Date.now();
    const token = signSession({ pubkey: data.pubkey, iat: now, exp: now + 1000 * 60 * 60 * 24 * 7 });
    setCookie("null_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return { ok: true, pubkey: data.pubkey };
  });

export const getAuthSession = createServerFn({ method: "GET" }).handler(async () => {
  const t = getCookie("null_session");
  if (!t) return { pubkey: null as string | null };
  const v = verifySession(t);
  return { pubkey: v?.pubkey ?? null };
});

export const logoutAuth = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie("null_session", { path: "/" });
  return { ok: true };
});

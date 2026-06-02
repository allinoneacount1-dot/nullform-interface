import { c as createServerRpc } from "./createServerRpc-DUq7MKf3.mjs";
import { a as createServerFn, s as setCookie, g as getCookie, d as deleteCookie } from "./server-cZkq-rCv.mjs";
import { n as nacl } from "../_libs/tweetnacl.mjs";
import { a as bs58 } from "../_libs/bs58.mjs";
import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:stream";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "crypto";
import "async_hooks";
import "util";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/base-x.mjs";
import "../_libs/safe-buffer.mjs";
import "buffer";
const NONCE_TTL_MS = 5 * 60 * 1e3;
const nonces = /* @__PURE__ */ new Map();
function gcNonces() {
  const now = Date.now();
  for (const [k, v] of nonces) if (v.expires < now) nonces.delete(k);
}
function getSecret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET missing or too short");
  return s;
}
function signSession(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}
function verifySession(token) {
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
const getAuthNonce_createServerFn_handler = createServerRpc({
  id: "0fd86b915028ec21790ba6558b0606712c2c00b85e9c28b145055e250507412f",
  name: "getAuthNonce",
  filename: "src/lib/auth.functions.ts"
}, (opts) => getAuthNonce.__executeServer(opts));
const getAuthNonce = createServerFn({
  method: "POST"
}).inputValidator(objectType({
  pubkey: stringType().min(32).max(64)
})).handler(getAuthNonce_createServerFn_handler, async ({
  data
}) => {
  gcNonces();
  const value = randomBytes(24).toString("hex");
  nonces.set(data.pubkey, {
    value,
    expires: Date.now() + NONCE_TTL_MS
  });
  const message = `NULL_FORM // SYS_AUTH
protocol: SIWS-v1
wallet: ${data.pubkey}
nonce: ${value}
issued: ${(/* @__PURE__ */ new Date()).toISOString()}
intent: confirm-you-are-nothing`;
  return {
    message,
    nonce: value
  };
});
const verifyAuthSignature_createServerFn_handler = createServerRpc({
  id: "887db650779822a61d54615421fd86dab087e8c362a1b2971ac608e3eaf93a51",
  name: "verifyAuthSignature",
  filename: "src/lib/auth.functions.ts"
}, (opts) => verifyAuthSignature.__executeServer(opts));
const verifyAuthSignature = createServerFn({
  method: "POST"
}).inputValidator(objectType({
  pubkey: stringType().min(32).max(64),
  signature: stringType().min(40).max(200),
  // base58
  message: stringType().min(40).max(1024)
})).handler(verifyAuthSignature_createServerFn_handler, async ({
  data
}) => {
  gcNonces();
  const rec = nonces.get(data.pubkey);
  if (!rec) throw new Error("nonce_expired_or_missing");
  if (!data.message.includes(`nonce: ${rec.value}`)) throw new Error("nonce_mismatch");
  if (!data.message.includes(`wallet: ${data.pubkey}`)) throw new Error("wallet_mismatch");
  let pkBytes;
  let sigBytes;
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
  const token = signSession({
    pubkey: data.pubkey,
    iat: now,
    exp: now + 1e3 * 60 * 60 * 24 * 7
  });
  setCookie("null_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
  return {
    ok: true,
    pubkey: data.pubkey
  };
});
const getAuthSession_createServerFn_handler = createServerRpc({
  id: "b28c72d5c19cb2360284b3c0a6709dcb8ad013f29a442bb69f315fd7d0d80e38",
  name: "getAuthSession",
  filename: "src/lib/auth.functions.ts"
}, (opts) => getAuthSession.__executeServer(opts));
const getAuthSession = createServerFn({
  method: "GET"
}).handler(getAuthSession_createServerFn_handler, async () => {
  const t = getCookie("null_session");
  if (!t) return {
    pubkey: null
  };
  const v = verifySession(t);
  return {
    pubkey: v?.pubkey ?? null
  };
});
const logoutAuth_createServerFn_handler = createServerRpc({
  id: "e48a6d946cd46f8952216be2bd7226ffa0493fbdf8e353305c5e102ae216f085",
  name: "logoutAuth",
  filename: "src/lib/auth.functions.ts"
}, (opts) => logoutAuth.__executeServer(opts));
const logoutAuth = createServerFn({
  method: "POST"
}).handler(logoutAuth_createServerFn_handler, async () => {
  deleteCookie("null_session", {
    path: "/"
  });
  return {
    ok: true
  };
});
export {
  getAuthNonce_createServerFn_handler,
  getAuthSession_createServerFn_handler,
  logoutAuth_createServerFn_handler,
  verifyAuthSignature_createServerFn_handler
};

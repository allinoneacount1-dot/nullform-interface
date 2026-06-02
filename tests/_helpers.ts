import type { PurgeDeps } from "@/lib/purge-core.server";

// Controllable clock + in-memory fake of the subset of Upstash REST
// commands used by the purge flow. Mirrors INCR+EXPIRE+TTL fixed-window
// semantics deterministically so concurrency, expiry, and idempotency
// can be asserted without network or wall-clock dependence.
export function createClock(start = 1_700_000_000_000) {
  return { now: start };
}

export type FakeRedis = PurgeDeps["redis"] & {
  _ints: Map<string, { value: number; expiresAt: number | null }>;
  _sets: Map<string, Set<string>>;
  _zsets: Map<string, Map<string, number>>;
  // test-only inspectors mirroring upstash REST surface
  zrevrange(key: string, start: number, stop: number): Promise<string[]>;
  zcard(key: string): Promise<number>;
};

export function createFakeRedis(clock: { now: number }): FakeRedis {
  const ints = new Map<string, { value: number; expiresAt: number | null }>();
  const sets = new Map<string, Set<string>>();
  const zsets = new Map<string, Map<string, number>>();

  function readInt(key: string) {
    const rec = ints.get(key);
    if (!rec) return null;
    if (rec.expiresAt !== null && rec.expiresAt <= clock.now) {
      ints.delete(key);
      return null;
    }
    return rec;
  }

  return {
    _ints: ints,
    _sets: sets,
    _zsets: zsets,
    async rateLimit(key, limit, windowSec) {
      const existing = readInt(key);
      const rec = existing ?? { value: 0, expiresAt: null as number | null };
      rec.value += 1;
      if (rec.value === 1) rec.expiresAt = clock.now + windowSec * 1000;
      ints.set(key, rec);
      const ttl = rec.expiresAt ? Math.max(0, rec.expiresAt - clock.now) : windowSec * 1000;
      return {
        allowed: rec.value <= limit,
        remaining: Math.max(0, limit - rec.value),
        resetMs: ttl,
      };
    },
    async sismember(key, member) {
      return sets.get(key)?.has(member) ? 1 : 0;
    },
    async sadd(key, member) {
      const s = sets.get(key) ?? new Set<string>();
      const had = s.has(member);
      s.add(member);
      sets.set(key, s);
      return had ? 0 : 1;
    },
    async zadd(key, score, member) {
      const z = zsets.get(key) ?? new Map<string, number>();
      const isNew = !z.has(member);
      z.set(member, score);
      zsets.set(key, z);
      return isNew ? 1 : 0;
    },
    async zrevrange(key, start, stop) {
      const z = zsets.get(key);
      if (!z) return [];
      const arr = [...z.entries()].sort((a, b) => b[1] - a[1]).map(([m]) => m);
      return arr.slice(start, stop + 1);
    },
    async zcard(key) {
      return zsets.get(key)?.size ?? 0;
    },
  };
}

// Real base58 mainnet pubkeys (WSOL mint, Token program, etc) so the
// integration handler's new PublicKey(target) check succeeds.
export const PUBKEY_OPERATOR_A = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
export const PUBKEY_OPERATOR_B = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const TARGET_WSOL = "So11111111111111111111111111111111111111112";
export const TARGET_TOKENKEG = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

export function buildAccountInfo(
  lamports = 12345,
  owner = "11111111111111111111111111111111",
  slot: number | null = 300_000_000,
) {
  return {
    info: { lamports, owner: { toBase58: () => owner } },
    slot,
  };
}

export function makeRandomId() {
  let n = 0;
  return () => `id-${++n}`;
}

// Signs a JSON payload the way verifyNullSession expects.
export async function signTestSession(pubkey: string, secret: string) {
  const { createHmac } = await import("node:crypto");
  const payload = { pubkey, iat: Date.now(), exp: Date.now() + 60_000 };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

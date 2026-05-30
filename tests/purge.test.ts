import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  processPurge,
  PURGE_LEDGER_KEY,
  PURGE_SEEN_KEY,
  PURGE_RATE_LIMIT,
  PURGE_RATE_WINDOW_SEC,
  type PurgeDeps,
} from "@/lib/purge-core.server";

/**
 * In-memory fake of the subset of Upstash Redis commands used by the
 * purge flow. Emulates fixed-window rate-limiting semantics exactly the
 * way the REST client's INCR+EXPIRE+TTL sequence does, but pinned to a
 * controllable clock so tests can step through windows deterministically.
 */
function createFakeRedis(clock: { now: number }) {
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
    async rateLimit(key: string, limit: number, windowSec: number) {
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
    async sismember(key: string, member: string) {
      return sets.get(key)?.has(member) ? 1 : 0;
    },
    async sadd(key: string, member: string) {
      const s = sets.get(key) ?? new Set<string>();
      const had = s.has(member);
      s.add(member);
      sets.set(key, s);
      return had ? 0 : 1;
    },
    async zadd(key: string, score: number, member: string) {
      const z = zsets.get(key) ?? new Map<string, number>();
      const isNew = !z.has(member);
      z.set(member, score);
      zsets.set(key, z);
      return isNew ? 1 : 0;
    },
  } satisfies PurgeDeps["redis"] & {
    _ints: typeof ints;
    _sets: typeof sets;
    _zsets: typeof zsets;
  };
}

const PUBKEY_A = "AAAA1111111111111111111111111111111111111111";
const PUBKEY_B = "BBBB2222222222222222222222222222222222222222";
const TARGET_X = "So11111111111111111111111111111111111111112";
const TARGET_Y = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

function buildDeps(overrides: Partial<PurgeDeps> = {}): {
  deps: PurgeDeps;
  clock: { now: number };
  redis: ReturnType<typeof createFakeRedis>;
} {
  const clock = { now: 1_700_000_000_000 };
  const redis = createFakeRedis(clock);
  let counter = 0;
  const deps: PurgeDeps = {
    redis,
    getAccountInfo: async () => ({
      info: { lamports: 12345, owner: { toBase58: () => "11111111111111111111111111111111" } },
      slot: 300_000_000,
    }),
    now: () => clock.now,
    randomId: () => `id-${++counter}`,
    ...overrides,
  };
  return { deps, clock, redis };
}

describe("processPurge — Upstash fixed-window rate limiting", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("allows exactly PURGE_RATE_LIMIT requests within a window, then 429s with retry-after metadata", async () => {
    const { deps, redis } = buildDeps();

    // Each call uses a distinct target so dedupe never short-circuits the rate-limit assertion.
    // processPurge does not validate base58 itself (the route does), so synthetic ids are fine.
    const targets = Array.from({ length: PURGE_RATE_LIMIT + 1 }, (_, i) => `TARGET_${i}`);

    for (let i = 0; i < PURGE_RATE_LIMIT; i++) {
      const r = await processPurge({ pubkey: PUBKEY_A, target: targets[i] }, deps);
      expect(r.ok, `call #${i + 1} should be allowed`).toBe(true);
    }

    const denied = await processPurge({ pubkey: PUBKEY_A, target: targets[PURGE_RATE_LIMIT] }, deps);
    expect(denied.ok).toBe(false);
    if (denied.ok) throw new Error("unreachable");
    expect(denied.status).toBe(429);
    expect(denied.error).toBe("rate_limited");
    expect(denied.resetMs).toBeGreaterThan(0);
    expect(denied.resetMs).toBeLessThanOrEqual(PURGE_RATE_WINDOW_SEC * 1000);

    // Counter persisted under per-wallet key, ledger only got the allowed writes.
    expect(redis._ints.get(`null:rl:purge:${PUBKEY_A}`)?.value).toBe(PURGE_RATE_LIMIT + 1);
    expect(redis._zsets.get(PURGE_LEDGER_KEY)?.size).toBe(PURGE_RATE_LIMIT);
  });

  it("isolates rate-limit buckets per operator wallet", async () => {
    const { deps } = buildDeps();
    for (let i = 0; i < PURGE_RATE_LIMIT; i++) {
      await processPurge({ pubkey: PUBKEY_A, target: `TARGET_${i}` }, deps);
    }
    // Operator A is now saturated; operator B's first request must still succeed.
    const r = await processPurge({ pubkey: PUBKEY_B, target: TARGET_X }, deps);
    expect(r.ok).toBe(true);
  });

  it("resets the window after PURGE_RATE_WINDOW_SEC elapses (TTL expiry)", async () => {
    const { deps, clock } = buildDeps();

    // Saturate operator A.
    for (let i = 0; i < PURGE_RATE_LIMIT; i++) {
      const r = await processPurge({ pubkey: PUBKEY_A, target: `TARGET_${i}` }, deps);
      expect(r.ok).toBe(true);
    }
    const blocked = await processPurge({ pubkey: PUBKEY_A, target: TARGET_Y }, deps);
    expect(blocked.ok).toBe(false);

    // Advance past the fixed window — the in-memory fake mirrors EXPIRE semantics.
    clock.now += PURGE_RATE_WINDOW_SEC * 1000 + 1;

    const reopened = await processPurge({ pubkey: PUBKEY_A, target: TARGET_Y }, deps);
    expect(reopened.ok).toBe(true);
  });

  it("returns 503 when the rate-limit backend is unavailable (fail-closed)", async () => {
    const { deps } = buildDeps();
    deps.redis.rateLimit = async () => {
      throw new Error("upstash_500");
    };
    const r = await processPurge({ pubkey: PUBKEY_A, target: TARGET_X }, deps);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("unreachable");
    expect(r.status).toBe(503);
    expect(r.error).toBe("rate_limit_unavailable");
  });
});

describe("processPurge — per-(operator,target) deduplication", () => {
  it("rejects a repeat purge of the same target by the same operator with 409", async () => {
    const { deps, redis } = buildDeps();

    const first = await processPurge({ pubkey: PUBKEY_A, target: TARGET_X }, deps);
    expect(first.ok).toBe(true);

    const second = await processPurge({ pubkey: PUBKEY_A, target: TARGET_X }, deps);
    expect(second.ok).toBe(false);
    if (second.ok) throw new Error("unreachable");
    expect(second.status).toBe(409);
    expect(second.error).toBe("already_purged");

    // Dedupe set holds the composite key; ledger only got the first write.
    expect(redis._sets.get(PURGE_SEEN_KEY)?.has(`${PUBKEY_A}:${TARGET_X}`)).toBe(true);
    expect(redis._zsets.get(PURGE_LEDGER_KEY)?.size).toBe(1);
  });

  it("scopes dedupe per operator — operator B can still purge a target operator A purged", async () => {
    const { deps } = buildDeps();
    const a = await processPurge({ pubkey: PUBKEY_A, target: TARGET_X }, deps);
    const b = await processPurge({ pubkey: PUBKEY_B, target: TARGET_X }, deps);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
  });

  it("scopes dedupe per target — operator A can purge a different target after the first", async () => {
    const { deps } = buildDeps();
    const a = await processPurge({ pubkey: PUBKEY_A, target: TARGET_X }, deps);
    const b = await processPurge({ pubkey: PUBKEY_A, target: TARGET_Y }, deps);
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
  });

  it("dedupe check runs AFTER rate-limit decrement (rate limit is the outer gate)", async () => {
    const { deps, redis } = buildDeps();
    // Pre-mark target as already purged.
    await redis.sadd(PURGE_SEEN_KEY, `${PUBKEY_A}:${TARGET_X}`);

    const r = await processPurge({ pubkey: PUBKEY_A, target: TARGET_X }, deps);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("unreachable");
    expect(r.status).toBe(409);

    // The denied attempt consumed one rate-limit slot — this is the documented behavior.
    expect(redis._ints.get(`null:rl:purge:${PUBKEY_A}`)?.value).toBe(1);
  });
});

describe("processPurge — on-chain account guards short-circuit the ledger write", () => {
  it("returns 404 when the account does not exist", async () => {
    const { deps, redis } = buildDeps({
      getAccountInfo: async () => ({ info: null, slot: 1 }),
    });
    const r = await processPurge({ pubkey: PUBKEY_A, target: TARGET_X }, deps);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("unreachable");
    expect(r.status).toBe(404);
    expect(redis._zsets.get(PURGE_LEDGER_KEY)).toBeUndefined();
  });

  it("returns 410 when the account is already at zero lamports (already void)", async () => {
    const { deps } = buildDeps({
      getAccountInfo: async () => ({
        info: { lamports: 0, owner: { toBase58: () => "11111111111111111111111111111111" } },
        slot: 1,
      }),
    });
    const r = await processPurge({ pubkey: PUBKEY_A, target: TARGET_X }, deps);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("unreachable");
    expect(r.status).toBe(410);
  });
});

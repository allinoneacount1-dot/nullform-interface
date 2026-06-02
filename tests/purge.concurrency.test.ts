import { describe, it, expect } from "vitest";
import {
  processPurge,
  PURGE_LEDGER_KEY,
  PURGE_RATE_LIMIT,
} from "@/lib/purge-core.server";
import {
  createClock,
  createFakeRedis,
  buildAccountInfo,
  PUBKEY_OPERATOR_A,
} from "./_helpers";

function deps(clock: { now: number }, redis: ReturnType<typeof createFakeRedis>) {
  let n = 0;
  return {
    redis,
    getAccountInfo: async () => buildAccountInfo(),
    now: () => clock.now,
    randomId: () => `sig-${++n}`,
  };
}

describe("processPurge — concurrent purges respect the rate-limit window", () => {
  it("N parallel requests with N > limit → exactly limit succeed, rest are 429", async () => {
    const clock = createClock();
    const redis = createFakeRedis(clock);
    const d = deps(clock, redis);

    const N = PURGE_RATE_LIMIT * 2;
    const results = await Promise.all(
      Array.from({ length: N }, (_, i) =>
        processPurge({ pubkey: PUBKEY_OPERATOR_A, target: `T_${i}` }, d),
      ),
    );
    const ok = results.filter((r) => r.ok).length;
    const limited = results.filter((r) => !r.ok && r.status === 429).length;
    expect(ok).toBe(PURGE_RATE_LIMIT);
    expect(limited).toBe(N - PURGE_RATE_LIMIT);
    expect(redis._zsets.get(PURGE_LEDGER_KEY)?.size).toBe(PURGE_RATE_LIMIT);
  });

  it("concurrent identical (operator,target) calls only land one ledger row", async () => {
    const clock = createClock();
    const redis = createFakeRedis(clock);
    const d = deps(clock, redis);

    // Pre-mark sismember/sadd to behave atomically — JS event loop already serializes
    // these microtasks, so dedupe naturally collapses concurrent duplicates.
    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        processPurge({ pubkey: PUBKEY_OPERATOR_A, target: "DUPLICATE" }, d),
      ),
    );
    const ok = results.filter((r) => r.ok).length;
    const conflict = results.filter((r) => !r.ok && r.status === 409).length;
    expect(ok).toBe(1);
    expect(conflict + ok + results.filter((r) => !r.ok && r.status === 429).length).toBe(6);
    expect(redis._zsets.get(PURGE_LEDGER_KEY)?.size).toBe(1);
  });

  it("rate-limit reset semantics — saturate, advance window, refill cleanly", async () => {
    const clock = createClock();
    const redis = createFakeRedis(clock);
    const d = deps(clock, redis);

    for (let i = 0; i < PURGE_RATE_LIMIT; i++) {
      const r = await processPurge({ pubkey: PUBKEY_OPERATOR_A, target: `A_${i}` }, d);
      expect(r.ok).toBe(true);
    }
    const blocked = await processPurge({ pubkey: PUBKEY_OPERATOR_A, target: "AFTER" }, d);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      // resetMs is strictly positive and never exceeds the window
      expect(blocked.resetMs).toBeGreaterThan(0);
    }

    // Step past the window — next call must reopen.
    clock.now += 60 * 60 * 1000 + 1;
    const reopened = await processPurge({ pubkey: PUBKEY_OPERATOR_A, target: "AFTER" }, d);
    expect(reopened.ok).toBe(true);
  });
});

describe("processPurge — Upstash 429 / timeout / partial-failure scenarios", () => {
  it("Upstash returns its own 429 (we model it as a thrown upstash_429) → 503 fail-closed", async () => {
    const clock = createClock();
    const redis = createFakeRedis(clock);
    const d = deps(clock, redis);
    d.redis.rateLimit = async () => {
      throw new Error("upstash_429");
    };
    const r = await processPurge({ pubkey: PUBKEY_OPERATOR_A, target: "X" }, d);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("unreachable");
    expect(r.status).toBe(503);
    expect(r.error).toBe("rate_limit_unavailable");
    expect(r.detail).toContain("upstash_429");
  });

  it("Upstash REST timeout (modeled as a Promise that rejects after Δ) → 503 fast", async () => {
    const clock = createClock();
    const redis = createFakeRedis(clock);
    const d = deps(clock, redis);
    d.redis.rateLimit = () =>
      new Promise((_, reject) => setTimeout(() => reject(new Error("etimedout")), 5));
    const t0 = Date.now();
    const r = await processPurge({ pubkey: PUBKEY_OPERATOR_A, target: "X" }, d);
    const dur = Date.now() - t0;
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("unreachable");
    expect(r.status).toBe(503);
    expect(dur).toBeLessThan(500); // no retry storm
  });

  it("ledger zadd failure surfaces 500 ledger_write_failed (rate-limit slot still consumed)", async () => {
    const clock = createClock();
    const redis = createFakeRedis(clock);
    const d = deps(clock, redis);
    d.redis.zadd = async () => {
      throw new Error("upstash_zadd_oom");
    };
    const r = await processPurge({ pubkey: PUBKEY_OPERATOR_A, target: "X" }, d);
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error("unreachable");
    expect(r.status).toBe(500);
    expect(r.error).toBe("ledger_write_failed");
    expect(redis._ints.get(`null:rl:purge:${PUBKEY_OPERATOR_A}`)?.value).toBe(1);
  });

  it("Upstash flaps mid-burst — first ok, second throws, third ok → only ok calls write to ledger", async () => {
    const clock = createClock();
    const redis = createFakeRedis(clock);
    const d = deps(clock, redis);
    const realZadd = redis.zadd.bind(redis);
    let call = 0;
    redis.zadd = async (k, s, m) => {
      call++;
      if (call === 2) throw new Error("transient_upstash");
      return realZadd(k, s, m);
    };
    await processPurge({ pubkey: PUBKEY_OPERATOR_A, target: "A" }, d);
    await processPurge({ pubkey: PUBKEY_OPERATOR_A, target: "B" }, d); // zadd throws
    await processPurge({ pubkey: PUBKEY_OPERATOR_A, target: "C" }, d);
    expect(redis._zsets.get(PURGE_LEDGER_KEY)?.size).toBe(2);
  });
});

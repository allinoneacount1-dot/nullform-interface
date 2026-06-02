import { describe, it, expect } from "vitest";
import {
  processPurge,
  PURGE_LEDGER_KEY,
  PURGE_SEEN_KEY,
  type PurgedContract,
} from "@/lib/purge-core.server";
import {
  createClock,
  createFakeRedis,
  buildAccountInfo,
  PUBKEY_OPERATOR_A,
  PUBKEY_OPERATOR_B,
  TARGET_WSOL,
  TARGET_TOKENKEG,
} from "./_helpers";

function depsFrom(
  clock: { now: number },
  redis: ReturnType<typeof createFakeRedis>,
  account = buildAccountInfo(),
) {
  let n = 0;
  return {
    redis,
    getAccountInfo: async () => account,
    now: () => clock.now,
    randomId: () => `sig-${++n}`,
  };
}

function parseLedger(rows: string[]): PurgedContract[] {
  return rows.map((r) => JSON.parse(r) as PurgedContract);
}

describe("PurgedContract ledger ZSET — entry format", () => {
  it("stores entry as JSON string with all required fields and correct types", async () => {
    const clock = createClock(1_700_000_111_000);
    const redis = createFakeRedis(clock);
    const r = await processPurge(
      { pubkey: PUBKEY_OPERATOR_A, target: TARGET_WSOL, note: "rite" },
      depsFrom(clock, redis, buildAccountInfo(99, "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", 42)),
    );
    expect(r.ok).toBe(true);

    const [raw] = await redis.zrevrange(PURGE_LEDGER_KEY, 0, 0);
    expect(typeof raw).toBe("string");
    const entry = JSON.parse(raw) as PurgedContract;
    expect(entry).toEqual({
      signature: "sig-1",
      pubkey: PUBKEY_OPERATOR_A,
      target: TARGET_WSOL,
      slot: 42,
      ownerProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      lamports: 99,
      ts: 1_700_000_111_000,
      note: "rite",
    });
  });

  it("note defaults to null when omitted (not undefined — must survive JSON round-trip)", async () => {
    const clock = createClock();
    const redis = createFakeRedis(clock);
    await processPurge(
      { pubkey: PUBKEY_OPERATOR_A, target: TARGET_WSOL },
      depsFrom(clock, redis),
    );
    const [raw] = await redis.zrevrange(PURGE_LEDGER_KEY, 0, 0);
    const entry = JSON.parse(raw) as PurgedContract;
    expect(entry.note).toBeNull();
    // explicit null is preserved — JSON.stringify drops undefined keys
    expect(Object.keys(entry)).toContain("note");
  });

  it("ZSET score equals entry.ts and zrevrange returns newest-first", async () => {
    const clock = createClock(1_700_000_000_000);
    const redis = createFakeRedis(clock);
    const deps = depsFrom(clock, redis);

    await processPurge({ pubkey: PUBKEY_OPERATOR_A, target: TARGET_WSOL }, deps);
    clock.now += 5_000;
    await processPurge({ pubkey: PUBKEY_OPERATOR_A, target: TARGET_TOKENKEG }, deps);
    clock.now += 1_000;
    await processPurge({ pubkey: PUBKEY_OPERATOR_B, target: TARGET_WSOL }, deps);

    const zset = redis._zsets.get(PURGE_LEDGER_KEY)!;
    // every score must equal the embedded ts
    for (const [raw, score] of zset.entries()) {
      const e = JSON.parse(raw) as PurgedContract;
      expect(score).toBe(e.ts);
    }

    const rows = parseLedger(await redis.zrevrange(PURGE_LEDGER_KEY, 0, 10));
    expect(rows.map((r) => r.ts)).toEqual([
      1_700_000_006_000,
      1_700_000_005_000,
      1_700_000_000_000,
    ]);
  });

  it("zcard reflects ledger size monotonically", async () => {
    const clock = createClock();
    const redis = createFakeRedis(clock);
    const deps = depsFrom(clock, redis);
    expect(await redis.zcard(PURGE_LEDGER_KEY)).toBe(0);
    await processPurge({ pubkey: PUBKEY_OPERATOR_A, target: TARGET_WSOL }, deps);
    expect(await redis.zcard(PURGE_LEDGER_KEY)).toBe(1);
    await processPurge({ pubkey: PUBKEY_OPERATOR_B, target: TARGET_WSOL }, deps);
    expect(await redis.zcard(PURGE_LEDGER_KEY)).toBe(2);
  });
});

describe("PurgedContract ledger — idempotency rules", () => {
  it("same (operator,target) → ledger size stays at 1 after the second attempt", async () => {
    const clock = createClock();
    const redis = createFakeRedis(clock);
    const deps = depsFrom(clock, redis);
    await processPurge({ pubkey: PUBKEY_OPERATOR_A, target: TARGET_WSOL }, deps);
    const r2 = await processPurge({ pubkey: PUBKEY_OPERATOR_A, target: TARGET_WSOL }, deps);
    expect(r2.ok).toBe(false);
    expect(await redis.zcard(PURGE_LEDGER_KEY)).toBe(1);
    expect(redis._sets.get(PURGE_SEEN_KEY)?.size).toBe(1);
  });

  it("different operator on same target → distinct ledger rows + 2 dedupe members", async () => {
    const clock = createClock();
    const redis = createFakeRedis(clock);
    const deps = depsFrom(clock, redis);
    await processPurge({ pubkey: PUBKEY_OPERATOR_A, target: TARGET_WSOL }, deps);
    await processPurge({ pubkey: PUBKEY_OPERATOR_B, target: TARGET_WSOL }, deps);
    expect(await redis.zcard(PURGE_LEDGER_KEY)).toBe(2);
    expect(redis._sets.get(PURGE_SEEN_KEY)?.size).toBe(2);
    expect(redis._sets.get(PURGE_SEEN_KEY)?.has(`${PUBKEY_OPERATOR_A}:${TARGET_WSOL}`)).toBe(true);
    expect(redis._sets.get(PURGE_SEEN_KEY)?.has(`${PUBKEY_OPERATOR_B}:${TARGET_WSOL}`)).toBe(true);
  });

  it("signature field is unique per successful entry", async () => {
    const clock = createClock();
    const redis = createFakeRedis(clock);
    const deps = depsFrom(clock, redis);
    await processPurge({ pubkey: PUBKEY_OPERATOR_A, target: TARGET_WSOL }, deps);
    clock.now += 1;
    await processPurge({ pubkey: PUBKEY_OPERATOR_A, target: TARGET_TOKENKEG }, deps);
    const sigs = parseLedger(await redis.zrevrange(PURGE_LEDGER_KEY, 0, 10)).map((e) => e.signature);
    expect(new Set(sigs).size).toBe(sigs.length);
  });

  it("dedupe set write failure is soft — ledger still gets the entry", async () => {
    const clock = createClock();
    const redis = createFakeRedis(clock);
    const deps = depsFrom(clock, redis);
    redis.sismember = async () => {
      throw new Error("upstash_down");
    };
    const r = await processPurge({ pubkey: PUBKEY_OPERATOR_A, target: TARGET_WSOL }, deps);
    expect(r.ok).toBe(true);
    expect(await redis.zcard(PURGE_LEDGER_KEY)).toBe(1);
  });
});

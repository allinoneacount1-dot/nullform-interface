import { describe, it, expect } from "vitest";
import { handlePurgePost } from "@/lib/purge-handler.server";
import {
  createClock,
  createFakeRedis,
  buildAccountInfo,
  makeRandomId,
  signTestSession,
  PUBKEY_OPERATOR_A,
  PUBKEY_OPERATOR_B,
  TARGET_WSOL,
  TARGET_TOKENKEG,
} from "./_helpers";
import { PURGE_RATE_LIMIT, PURGE_LEDGER_KEY } from "@/lib/purge-core.server";

const SECRET = "test-session-secret-do-not-leak";

type ScenarioOverrides = {
  authPubkey?: string | null; // null → no/invalid cookie
  accountInfo?: ReturnType<typeof buildAccountInfo> | null;
};

async function build(overrides: ScenarioOverrides = {}) {
  const clock = createClock();
  const redis = createFakeRedis(clock);
  const deps = {
    redis,
    verifySession: (token: string | undefined) => {
      if (overrides.authPubkey === null) return null;
      if (!token) return null;
      // simple check — real verification is exercised by signed cookie path
      return { pubkey: overrides.authPubkey ?? PUBKEY_OPERATOR_A };
    },
    getAccountInfo: async () =>
      overrides.accountInfo === undefined
        ? buildAccountInfo()
        : (overrides.accountInfo ?? { info: null, slot: 1 }),
    now: () => clock.now,
    randomId: makeRandomId(),
  };
  return { clock, redis, deps };
}

async function authedRequest(body: unknown, pubkey = PUBKEY_OPERATOR_A) {
  const cookie = `null_session=${await signTestSession(pubkey, SECRET)}`;
  return new Request("https://x/api/purge", {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/purge — end-to-end via handler", () => {
  it("401 unauthorized when no SIWS cookie is present", async () => {
    const { deps } = await build({ authPubkey: null });
    const res = await handlePurgePost(
      new Request("https://x/api/purge", { method: "POST", body: "{}" }),
      deps,
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "unauthorized" });
  });

  it("400 bad_request when body fails Zod parsing", async () => {
    const { deps } = await build();
    const req = await authedRequest({ target: "too-short" });
    const res = await handlePurgePost(req, deps);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("bad_request");
    expect(body.detail).toBeTypeOf("string");
  });

  it("400 invalid_pubkey when base58 passes regex but PublicKey() rejects length", async () => {
    const { deps } = await build();
    // 33 valid base58 chars but not a 32-byte key
    const bogus = "1".repeat(40);
    const req = await authedRequest({ target: bogus });
    const res = await handlePurgePost(req, deps);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_pubkey");
  });

  it("404 account_not_found when getAccountInfo returns null", async () => {
    const { deps } = await build({ accountInfo: { info: null, slot: 1 } });
    const req = await authedRequest({ target: TARGET_WSOL });
    const res = await handlePurgePost(req, deps);
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("account_not_found");
  });

  it("410 account_already_void when lamports === 0", async () => {
    const { deps } = await build({ accountInfo: buildAccountInfo(0) });
    const req = await authedRequest({ target: TARGET_WSOL });
    const res = await handlePurgePost(req, deps);
    expect(res.status).toBe(410);
    expect((await res.json()).error).toBe("account_already_void");
  });

  it("200 ok with serializable PurgedContract entry on success", async () => {
    const { deps } = await build();
    const req = await authedRequest({ target: TARGET_WSOL, note: "  hi there  " });
    const res = await handlePurgePost(req, deps);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.entry).toMatchObject({
      pubkey: PUBKEY_OPERATOR_A,
      target: TARGET_WSOL,
      lamports: 12345,
      ownerProgram: "11111111111111111111111111111111",
      slot: 300_000_000,
      note: "hi there", // zod .trim()
    });
    expect(typeof body.entry.ts).toBe("number");
    expect(typeof body.entry.signature).toBe("string");
  });

  it("409 already_purged on second identical (operator,target) submission", async () => {
    const { deps } = await build();
    const r1 = await handlePurgePost(await authedRequest({ target: TARGET_WSOL }), deps);
    expect(r1.status).toBe(200);
    const r2 = await handlePurgePost(await authedRequest({ target: TARGET_WSOL }), deps);
    expect(r2.status).toBe(409);
    expect((await r2.json()).error).toBe("already_purged");
  });

  it("429 rate_limited surfaces retry-after + x-ratelimit-remaining headers", async () => {
    const { deps } = await build();
    // Saturate the wallet bucket using distinct targets so dedupe never trips.
    for (let i = 0; i < PURGE_RATE_LIMIT; i++) {
      const ok = await handlePurgePost(
        await authedRequest({ target: `${TARGET_WSOL.slice(0, -2)}${i.toString().padStart(2, "0")}` }),
        deps,
      );
      // Some synthetic targets may not be valid base58/length — re-use real WSOL on first,
      // then TOKENKEG to ensure at least 2 successful slots before assertion.
      // For determinism just spread across real keys:
      void ok;
    }
    // Use two known-valid keys to consume the bucket deterministically.
    const { deps: deps2 } = await build();
    const t = [TARGET_WSOL, TARGET_TOKENKEG];
    for (let i = 0; i < PURGE_RATE_LIMIT; i++) {
      await handlePurgePost(await authedRequest({ target: t[i % 2] }, `${PUBKEY_OPERATOR_A}`), deps2);
    }
    const denied = await handlePurgePost(
      await authedRequest({ target: TARGET_WSOL }, PUBKEY_OPERATOR_A),
      deps2,
    );
    expect(denied.status).toBe(429);
    expect(denied.headers.get("retry-after")).toBeTruthy();
    expect(denied.headers.get("x-ratelimit-remaining")).toBe("0");
    const body = await denied.json();
    expect(body.error).toBe("rate_limited");
    expect(body.resetMs).toBeGreaterThan(0);
  });

  it("503 rate_limit_unavailable when Upstash throws (fail-closed)", async () => {
    const { deps } = await build();
    deps.redis.rateLimit = async () => {
      throw new Error("upstash_500");
    };
    const res = await handlePurgePost(await authedRequest({ target: TARGET_WSOL }), deps);
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("rate_limit_unavailable");
  });

  it("502 rpc_failure when getAccountInfo throws", async () => {
    const { deps } = await build();
    deps.getAccountInfo = async () => {
      throw new Error("rpc_timeout");
    };
    const res = await handlePurgePost(await authedRequest({ target: TARGET_WSOL }), deps);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe("rpc_failure");
    expect(body.detail).toContain("rpc_timeout");
  });

  it("isolates buckets per operator: B succeeds even after A is saturated", async () => {
    const { deps, redis } = await build();
    for (let i = 0; i < PURGE_RATE_LIMIT; i++) {
      await handlePurgePost(
        await authedRequest({ target: i % 2 ? TARGET_WSOL : TARGET_TOKENKEG }, PUBKEY_OPERATOR_A),
        deps,
      );
    }
    // Re-point the fake session resolver to operator B for the next call.
    deps.verifySession = () => ({ pubkey: PUBKEY_OPERATOR_B });
    const res = await handlePurgePost(await authedRequest({ target: TARGET_WSOL }), deps);
    expect(res.status).toBe(200);
    expect(redis._ints.get(`null:rl:purge:${PUBKEY_OPERATOR_B}`)?.value).toBe(1);
  });

  it("writes one ledger row per successful purge and never on failure paths", async () => {
    const { deps, redis } = await build();
    await handlePurgePost(await authedRequest({ target: TARGET_WSOL }), deps);
    await handlePurgePost(await authedRequest({ target: TARGET_WSOL }), deps); // dedupe → 409
    await handlePurgePost(await authedRequest({ target: TARGET_TOKENKEG }), deps);
    expect(redis._zsets.get(PURGE_LEDGER_KEY)?.size).toBe(2);
  });
});

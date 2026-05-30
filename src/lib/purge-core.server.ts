import type { PublicKey } from "@solana/web3.js";

// Pure, injectable core of POST /api/purge. The route file wires real
// dependencies (Upstash REST, @solana/web3.js Connection); tests inject
// fakes to exercise rate-limit window math and per-(operator,target)
// dedupe without network or wall-clock dependencies.

export const PURGE_LEDGER_KEY = "null:purge:ledger";
export const PURGE_SEEN_KEY = "null:purge:targets";
export const PURGE_RATE_LIMIT = 5;
export const PURGE_RATE_WINDOW_SEC = 60 * 60;

export type PurgedContract = {
  signature: string;
  pubkey: string;
  target: string;
  slot: number | null;
  ownerProgram: string | null;
  lamports: number;
  ts: number;
  note: string | null;
};

export type AccountInfoLike = {
  lamports: number;
  owner: Pick<PublicKey, "toBase58">;
} | null;

export type PurgeDeps = {
  redis: {
    rateLimit(key: string, limit: number, windowSec: number): Promise<{
      allowed: boolean;
      remaining: number;
      resetMs: number;
    }>;
    sismember(key: string, member: string): Promise<number>;
    sadd(key: string, member: string): Promise<number>;
    zadd(key: string, score: number, member: string): Promise<number>;
  };
  getAccountInfo(target: string): Promise<{ info: AccountInfoLike; slot: number | null }>;
  now(): number;
  randomId(): string;
};

export type PurgeInput = { pubkey: string; target: string; note?: string };

export type PurgeResult =
  | { ok: true; entry: PurgedContract }
  | { ok: false; status: number; error: string; resetMs?: number; detail?: string };

export async function processPurge(input: PurgeInput, deps: PurgeDeps): Promise<PurgeResult> {
  // 1. Rate limit per operator wallet
  let rl;
  try {
    rl = await deps.redis.rateLimit(
      `null:rl:purge:${input.pubkey}`,
      PURGE_RATE_LIMIT,
      PURGE_RATE_WINDOW_SEC,
    );
  } catch (e) {
    return { ok: false, status: 503, error: "rate_limit_unavailable", detail: (e as Error).message };
  }
  if (!rl.allowed) {
    return { ok: false, status: 429, error: "rate_limited", resetMs: rl.resetMs };
  }

  // 2. On-chain validation
  let acc: { info: AccountInfoLike; slot: number | null };
  try {
    acc = await deps.getAccountInfo(input.target);
  } catch (e) {
    return { ok: false, status: 502, error: "rpc_failure", detail: (e as Error).message };
  }
  if (!acc.info) return { ok: false, status: 404, error: "account_not_found" };
  if (acc.info.lamports === 0) return { ok: false, status: 410, error: "account_already_void" };

  // 3. Per-(operator,target) dedupe
  const member = `${input.pubkey}:${input.target}`;
  try {
    const exists = await deps.redis.sismember(PURGE_SEEN_KEY, member);
    if (exists === 1) return { ok: false, status: 409, error: "already_purged" };
    await deps.redis.sadd(PURGE_SEEN_KEY, member);
  } catch {
    // soft-fail dedupe; ledger write still proceeds
  }

  // 4. Ledger write
  const ts = deps.now();
  const entry: PurgedContract = {
    signature: deps.randomId(),
    pubkey: input.pubkey,
    target: input.target,
    slot: acc.slot,
    ownerProgram: acc.info.owner.toBase58(),
    lamports: acc.info.lamports,
    ts,
    note: input.note ?? null,
  };
  try {
    await deps.redis.zadd(PURGE_LEDGER_KEY, ts, JSON.stringify(entry));
  } catch (e) {
    return { ok: false, status: 500, error: "ledger_write_failed", detail: (e as Error).message };
  }
  return { ok: true, entry };
}

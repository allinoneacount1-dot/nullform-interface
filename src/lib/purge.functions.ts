import { createServerFn } from "./react-start-stub";
import { z } from "zod";
import { redis } from "./upstash.server";

const LEDGER_KEY = "null:purge:ledger";

export type PurgedContract = {
  signature: string; // unique id (tx sig or random)
  pubkey: string; // operator wallet (base58)
  target: string; // contract / mint purged (base58)
  slot: number | null;
  ownerProgram: string | null;
  lamports: number;
  ts: number; // unix ms
  note: string | null;
};

export const getPurgeFeed = createServerFn({ method: "GET" })
  .inputValidator(z.object({ limit: z.number().min(1).max(50).optional() }))
  .handler(async ({ data }) => {
    try {
      const limit = data.limit ?? 20;
      const [rows, total] = await Promise.all([
        redis.zrevrange(LEDGER_KEY, 0, limit - 1),
        redis.zcard(LEDGER_KEY),
      ]);
      const entries = (rows ?? [])
        .map((r) => {
          try {
            return JSON.parse(r) as PurgedContract;
          } catch {
            return null;
          }
        })
        .filter((x): x is PurgedContract => !!x);
      return { entries, total: total ?? 0, error: null as string | null };
    } catch (e) {
      return { entries: [] as PurgedContract[], total: 0, error: (e as Error).message };
    }
  });

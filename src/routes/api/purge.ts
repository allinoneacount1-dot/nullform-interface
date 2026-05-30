import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Connection, PublicKey } from "@solana/web3.js";
import { verifyNullSession } from "@/lib/session.server";
import { redis } from "@/lib/upstash.server";
import type { PurgedContract } from "@/lib/purge.functions";

const LEDGER_KEY = "null:purge:ledger";
const SEEN_KEY = "null:purge:targets"; // dedupe set
const RATE_LIMIT = 5; // purges
const RATE_WINDOW = 60 * 60; // per hour

const Body = z.object({
  target: z
    .string()
    .min(32)
    .max(64)
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "invalid_base58"),
  note: z.string().trim().max(140).optional(),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function parseCookie(header: string | null, name: string) {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export const Route = createFileRoute("/api/purge")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // 1. AuthN — require SIWS-issued session cookie
        const sess = verifyNullSession(parseCookie(request.headers.get("cookie"), "null_session"));
        if (!sess) return json({ error: "unauthorized" }, 401);

        // 2. Body validation
        let parsed: z.infer<typeof Body>;
        try {
          const raw = await request.json();
          parsed = Body.parse(raw);
        } catch (e) {
          return json({ error: "bad_request", detail: (e as Error).message }, 400);
        }

        // 3. Distributed rate limit (per wallet, fixed window)
        try {
          const rl = await redis.rateLimit(`null:rl:purge:${sess.pubkey}`, RATE_LIMIT, RATE_WINDOW);
          if (!rl.allowed) {
            return new Response(
              JSON.stringify({ error: "rate_limited", resetMs: rl.resetMs }),
              {
                status: 429,
                headers: {
                  "content-type": "application/json",
                  "retry-after": String(Math.ceil(rl.resetMs / 1000)),
                  "x-ratelimit-remaining": "0",
                },
              },
            );
          }
        } catch (e) {
          return json({ error: "rate_limit_unavailable", detail: (e as Error).message }, 503);
        }

        // 4. PublicKey shape validation
        let targetPk: PublicKey;
        try {
          targetPk = new PublicKey(parsed.target);
        } catch {
          return json({ error: "invalid_pubkey" }, 400);
        }

        // 5. On-chain validation — getAccountInfo
        const rpcUrl = process.env.SOLANA_RPC_HTTP_URL ?? "https://api.mainnet-beta.solana.com";
        const conn = new Connection(rpcUrl, "confirmed");
        let info: Awaited<ReturnType<Connection["getAccountInfo"]>>;
        let slot: number | null = null;
        try {
          [info, slot] = await Promise.all([
            conn.getAccountInfo(targetPk, "confirmed"),
            conn.getSlot("confirmed").catch(() => null),
          ]);
        } catch (e) {
          return json({ error: "rpc_failure", detail: (e as Error).message }, 502);
        }
        if (!info) return json({ error: "account_not_found" }, 404);
        if (info.lamports === 0) return json({ error: "account_already_void" }, 410);

        // 6. Dedupe — one purge per (operator, target)
        const dedupeMember = `${sess.pubkey}:${parsed.target}`;
        try {
          const exists = await redis.sismember(SEEN_KEY, dedupeMember);
          if (exists === 1) return json({ error: "already_purged" }, 409);
          await redis.sadd(SEEN_KEY, dedupeMember);
        } catch {
          // soft-fail dedupe; ledger write still proceeds
        }

        // 7. Append to PurgedContract ledger (Redis sorted set by timestamp)
        const ts = Date.now();
        const entry: PurgedContract = {
          signature: `${ts.toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
          pubkey: sess.pubkey,
          target: parsed.target,
          slot,
          ownerProgram: info.owner.toBase58(),
          lamports: info.lamports,
          ts,
          note: parsed.note ?? null,
        };
        try {
          await redis.zadd(LEDGER_KEY, ts, JSON.stringify(entry));
        } catch (e) {
          return json({ error: "ledger_write_failed", detail: (e as Error).message }, 500);
        }

        return json({ ok: true, entry });
      },
    },
  },
});

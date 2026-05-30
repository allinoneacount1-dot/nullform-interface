import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Connection, PublicKey } from "@solana/web3.js";
import { verifyNullSession } from "@/lib/session.server";
import { redis } from "@/lib/upstash.server";
import type { PurgedContract } from "@/lib/purge.functions";
import { processPurge } from "@/lib/purge-core.server";

const Body = z.object({
  target: z
    .string()
    .min(32)
    .max(64)
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "invalid_base58"),
  note: z.string().trim().max(140).optional(),
});

function json(body: unknown, status = 200, extra?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...(extra ?? {}) },
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
        const sess = verifyNullSession(parseCookie(request.headers.get("cookie"), "null_session"));
        if (!sess) return json({ error: "unauthorized" }, 401);

        let parsed: z.infer<typeof Body>;
        try {
          parsed = Body.parse(await request.json());
        } catch (e) {
          return json({ error: "bad_request", detail: (e as Error).message }, 400);
        }

        // Solana PublicKey shape (catches valid-base58-but-wrong-length)
        let targetPk: PublicKey;
        try {
          targetPk = new PublicKey(parsed.target);
        } catch {
          return json({ error: "invalid_pubkey" }, 400);
        }

        const rpcUrl = process.env.SOLANA_RPC_HTTP_URL ?? "https://api.mainnet-beta.solana.com";
        const conn = new Connection(rpcUrl, "confirmed");

        const result = await processPurge(
          { pubkey: sess.pubkey, target: parsed.target, note: parsed.note },
          {
            redis,
            getAccountInfo: async () => {
              const [info, slot] = await Promise.all([
                conn.getAccountInfo(targetPk, "confirmed"),
                conn.getSlot("confirmed").catch(() => null),
              ]);
              return { info: info as PurgedContract extends never ? never : typeof info, slot };
            },
            now: () => Date.now(),
            randomId: () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
          },
        );

        if (!result.ok) {
          const extra: Record<string, string> = {};
          if (result.error === "rate_limited" && result.resetMs) {
            extra["retry-after"] = String(Math.ceil(result.resetMs / 1000));
            extra["x-ratelimit-remaining"] = "0";
          }
          return json(
            { error: result.error, ...(result.resetMs ? { resetMs: result.resetMs } : {}), ...(result.detail ? { detail: result.detail } : {}) },
            result.status,
            extra,
          );
        }
        return json({ ok: true, entry: result.entry });
      },
    },
  },
});

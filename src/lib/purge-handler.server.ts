import { z } from "zod";
import { PublicKey } from "@solana/web3.js";
import { processPurge, type PurgeDeps } from "./purge-core.server";

// Pure, dependency-injected POST /api/purge handler. The TanStack route
// wires real Upstash + Solana RPC + SIWS-cookie verification; tests inject
// fakes and assert HTTP-level behavior (status, headers, body shape).

export const PurgeBody = z.object({
  target: z
    .string()
    .min(32)
    .max(64)
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "invalid_base58"),
  note: z.string().trim().max(140).optional(),
});

export type HandlerDeps = Omit<PurgeDeps, "getAccountInfo"> & {
  verifySession: (token: string | undefined) => { pubkey: string } | null;
  getAccountInfo: (target: string, pk: PublicKey) => ReturnType<PurgeDeps["getAccountInfo"]>;
};

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

export async function handlePurgePost(request: Request, deps: HandlerDeps): Promise<Response> {
  const sess = deps.verifySession(parseCookie(request.headers.get("cookie"), "null_session"));
  if (!sess) return json({ error: "unauthorized" }, 401);

  let parsed: z.infer<typeof PurgeBody>;
  try {
    parsed = PurgeBody.parse(await request.json());
  } catch (e) {
    return json({ error: "bad_request", detail: (e as Error).message }, 400);
  }

  let targetPk: PublicKey;
  try {
    targetPk = new PublicKey(parsed.target);
  } catch {
    return json({ error: "invalid_pubkey" }, 400);
  }

  const result = await processPurge(
    { pubkey: sess.pubkey, target: parsed.target, note: parsed.note },
    {
      redis: deps.redis,
      getAccountInfo: () => deps.getAccountInfo(parsed.target, targetPk),
      now: deps.now,
      randomId: deps.randomId,
    },
  );

  if (!result.ok) {
    const extra: Record<string, string> = {};
    if (result.error === "rate_limited" && result.resetMs) {
      extra["retry-after"] = String(Math.ceil(result.resetMs / 1000));
      extra["x-ratelimit-remaining"] = "0";
    }
    return json(
      {
        error: result.error,
        ...(result.resetMs ? { resetMs: result.resetMs } : {}),
        ...(result.detail ? { detail: result.detail } : {}),
      },
      result.status,
      extra,
    );
  }
  return json({ ok: true, entry: result.entry });
}

// Dependency-injectable core of the /api/intel SSE endpoint.
// The route file is a thin wrapper; tests construct a stream with a fake
// prisma + verifier and assert framing / cursor / keepalive behavior.

export type IntelRow = {
  id: string;
  slot: number | null;
  headline: string;
  body: string;
  redactedSpans: unknown;
  classification: "PUBLIC" | "RESTRICTED" | "CLASSIFIED" | "REDACTED";
  createdAt: Date;
};

export type IntelPrisma = {
  terminalIntel: {
    findMany(args: {
      where?: { createdAt?: { gt: Date } };
      orderBy?: { createdAt: "asc" | "desc" };
      take?: number;
    }): Promise<IntelRow[]>;
  };
};

export type IntelDeps = {
  prisma: IntelPrisma;
  verifySession: (token: string | undefined) => { pubkey: string } | null;
  pollMs?: number;
  pingMs?: number;
  backfillTake?: number;
  pollTake?: number;
  /** Inject setInterval/clearInterval (tests use fake timers). */
  setInterval?: typeof globalThis.setInterval;
  clearInterval?: typeof globalThis.clearInterval;
};

export function parseCookie(header: string | null, name: string) {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

export function sseFrame(event: string | null, data: unknown, id?: string) {
  const lines: string[] = [];
  if (id) lines.push(`id: ${id}`);
  if (event) lines.push(`event: ${event}`);
  lines.push(`data: ${JSON.stringify(data)}`);
  lines.push("", "");
  return lines.join("\n");
}

// Stable error envelope. Strips secrets, URLs, tokens, IPs, and long opaque
// blobs before emission so an upstream Prisma/Postgres failure cannot leak
// connection strings or API keys to the SSE client. Keeps short, snake_case
// error codes (e.g. "prisma_timeout_backfill") intact for client routing.
const SAFE_CODE = /^[a-z][a-z0-9_]{1,63}$/i;
export function redactErrorMessage(input: unknown): string {
  const raw = input instanceof Error ? input.message : String(input ?? "");
  if (!raw) return "stream_error";
  if (SAFE_CODE.test(raw.trim())) return raw.trim();
  let msg = raw
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, "[REDACTED_URL]")
    .replace(/prisma:\/\/[^\s"']+/gi, "[REDACTED_URL]")
    .replace(/https?:\/\/[^\s"']+/gi, "[REDACTED_URL]")
    .replace(/api[_-]?key=[^\s"'&]+/gi, "api_key=[REDACTED]")
    .replace(/(?:bearer|token)\s+[A-Za-z0-9._\-]+/gi, "[REDACTED_TOKEN]")
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?\b/g, "[REDACTED_IP]")
    .replace(/[A-Za-z0-9_\-]{32,}/g, "[REDACTED]")
    .replace(/\s+/g, " ")
    .trim();
  if (msg.length > 200) msg = msg.slice(0, 200) + "…";
  return msg || "stream_error";
}

export async function handleIntelGet(request: Request, deps: IntelDeps): Promise<Response> {
  const sess = deps.verifySession(parseCookie(request.headers.get("cookie"), "null_session"));
  if (!sess) return new Response("unauthorized", { status: 401 });

  const pollMs = deps.pollMs ?? 2_000;
  const pingMs = deps.pingMs ?? 15_000;
  const backfillTake = deps.backfillTake ?? 20;
  const pollTake = deps.pollTake ?? 50;
  const setI = deps.setInterval ?? globalThis.setInterval;
  const clearI = deps.clearInterval ?? globalThis.clearInterval;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      let cursor = new Date(0);
      let pingId: ReturnType<typeof setInterval> | null = null;
      let pollId: ReturnType<typeof setInterval> | null = null;
      let errSeq = 0;
      let lastErrCode: string | null = null;
      let lastErrAt = 0;

      const send = (event: string | null, data: unknown, id?: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(sseFrame(event, data, id)));
        } catch {
          close();
        }
      };
      const sendError = (e: unknown, phase: "backfill" | "poll") => {
        const message = redactErrorMessage(e);
        // Deduplicate identical, rapid-fire errors within 1s so a flapping
        // Prisma connection cannot drown out ping frames.
        const code = `${phase}:${message}`;
        const now = Date.now();
        if (code === lastErrCode && now - lastErrAt < 1_000) return;
        lastErrCode = code;
        lastErrAt = now;
        errSeq += 1;
        send("error", { phase, message, seq: errSeq }, `err-${errSeq}`);
      };
      const close = () => {
        if (closed) return;
        closed = true;
        if (pingId) clearI(pingId);
        if (pollId) clearI(pollId);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      request.signal.addEventListener("abort", close);

      // Ping cadence is established FIRST and never reset on errors, so the
      // keepalive interval stays deterministic even if Prisma misbehaves.
      pingId = setI(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ping\ndata: ${Date.now()}\n\n`));
        } catch {
          close();
        }
      }, pingMs);

      try {
        const rows = await deps.prisma.terminalIntel.findMany({
          orderBy: { createdAt: "desc" },
          take: backfillTake,
        });
        send("backfill", rows);
        if (rows.length) cursor = rows[0].createdAt;
      } catch (e) {
        sendError(e, "backfill");
        close();
        return;
      }

      pollId = setI(async () => {
        if (closed) return;
        try {
          const rows = await deps.prisma.terminalIntel.findMany({
            where: { createdAt: { gt: cursor } },
            orderBy: { createdAt: "asc" },
            take: pollTake,
          });
          for (const r of rows) {
            send("intel", r);
            if (r.createdAt > cursor) cursor = r.createdAt;
          }
        } catch (e) {
          sendError(e, "poll");
        }
      }, pollMs);
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no",
    },
  });
}

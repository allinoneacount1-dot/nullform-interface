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

export function sseFrame(event: string | null, data: unknown) {
  const lines: string[] = [];
  if (event) lines.push(`event: ${event}`);
  lines.push(`data: ${JSON.stringify(data)}`);
  lines.push("", "");
  return lines.join("\n");
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

      const send = (event: string | null, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(sseFrame(event, data)));
        } catch {
          close();
        }
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

      try {
        const rows = await deps.prisma.terminalIntel.findMany({
          orderBy: { createdAt: "desc" },
          take: backfillTake,
        });
        send("backfill", rows);
        if (rows.length) cursor = rows[0].createdAt;
      } catch (e) {
        send("error", { message: (e as Error).message });
        close();
        return;
      }

      pingId = setI(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ping\ndata: ${Date.now()}\n\n`));
        } catch {
          close();
        }
      }, pingMs);

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
          send("error", { message: (e as Error).message });
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

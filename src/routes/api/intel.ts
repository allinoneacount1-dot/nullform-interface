import { createFileRoute } from "@tanstack/react-router";
import { verifyNullSession } from "@/lib/session.server";
import { getPrisma } from "@/lib/prisma.server";

// Authenticated Server-Sent Events stream of TerminalIntel rows.
// Contract:
//   - Requires a valid null_session cookie (SIWS). 401 otherwise.
//   - Initial backfill: most recent 20 rows, newest first as a single frame.
//   - Then polls Postgres every 2s for createdAt > cursor; emits one
//     `data: {json}\n\n` frame per row.
//   - Keepalive `event: ping` every 15s so intermediaries don't reap idle conns.
//   - Closes cleanly on request.signal abort (tab close / nav away).

const POLL_MS = 2_000;
const PING_MS = 15_000;

function parseCookie(header: string | null, name: string) {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return undefined;
}

function sse(event: string | null, data: unknown) {
  const lines: string[] = [];
  if (event) lines.push(`event: ${event}`);
  lines.push(`data: ${JSON.stringify(data)}`);
  lines.push("", "");
  return lines.join("\n");
}

export const Route = createFileRoute("/api/intel")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const sess = verifyNullSession(parseCookie(request.headers.get("cookie"), "null_session"));
        if (!sess) return new Response("unauthorized", { status: 401 });

        const encoder = new TextEncoder();
        const prisma = getPrisma();

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const send = (event: string | null, data: unknown) =>
              controller.enqueue(encoder.encode(sse(event, data)));

            let cursor = new Date(0);
            let closed = false;
            const close = () => {
              if (closed) return;
              closed = true;
              try {
                controller.close();
              } catch {
                /* already closed */
              }
            };

            request.signal.addEventListener("abort", close);

            // Initial backfill
            try {
              const rows = await prisma.terminalIntel.findMany({
                orderBy: { createdAt: "desc" },
                take: 20,
              });
              send("backfill", rows);
              if (rows.length) cursor = rows[0].createdAt;
            } catch (e) {
              send("error", { message: (e as Error).message });
              close();
              return;
            }

            const pingInterval = setInterval(() => {
              if (closed) return;
              try {
                controller.enqueue(encoder.encode(`event: ping\ndata: ${Date.now()}\n\n`));
              } catch {
                close();
              }
            }, PING_MS);

            const pollInterval = setInterval(async () => {
              if (closed) return;
              try {
                const rows = await prisma.terminalIntel.findMany({
                  where: { createdAt: { gt: cursor } },
                  orderBy: { createdAt: "asc" },
                  take: 50,
                });
                for (const r of rows) {
                  send("intel", r);
                  if (r.createdAt > cursor) cursor = r.createdAt;
                }
              } catch (e) {
                send("error", { message: (e as Error).message });
              }
            }, POLL_MS);

            request.signal.addEventListener("abort", () => {
              clearInterval(pingInterval);
              clearInterval(pollInterval);
            });
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
      },
    },
  },
});

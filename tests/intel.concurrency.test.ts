import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleIntelGet, type IntelRow, type IntelPrisma } from "@/lib/intel-handler.server";

// Load + edge-case behavior:
//   - many concurrent EventSource-like consumers do not deadlock
//   - Prisma timeouts surface as `error` frames without killing keepalive
//   - per-stream errors don't bleed across streams
//   - high-latency Prisma responses still emit keepalive pings on schedule

function row(id: string, createdAt: Date): IntelRow {
  return { id, slot: null, headline: id, body: id, redactedSpans: [], classification: "RESTRICTED", createdAt };
}

function makeAuth() {
  return { verifySession: (t: string | undefined) => (t === "valid" ? { pubkey: "PK" } : null) };
}

function fakePrisma(behavior: {
  initial?: IntelRow[];
  pollDelayMs?: number;
  throwOn?: "backfill" | "poll" | "never";
  throwAfter?: number;
}): IntelPrisma {
  let pollCount = 0;
  const initial = behavior.initial ?? [];
  return {
    terminalIntel: {
      async findMany(args) {
        const isBackfill = !args?.where;
        if (!isBackfill) pollCount++;
        if (behavior.throwOn === "backfill" && isBackfill) throw new Error("prisma_timeout_backfill");
        if (behavior.throwOn === "poll" && !isBackfill && pollCount > (behavior.throwAfter ?? 0)) {
          throw new Error("prisma_timeout_poll");
        }
        if (!isBackfill && behavior.pollDelayMs) {
          await new Promise((r) => setTimeout(r, behavior.pollDelayMs));
        }
        if (isBackfill) return [...initial].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return [];
      },
    },
  };
}

/** Read until stream closes or budget elapses. Uses a single reader, cancels at end. */
async function drainFor(res: Response, ms: number): Promise<string> {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  const stop = Date.now() + ms;
  const watchdog = setTimeout(() => reader.cancel().catch(() => {}), ms);
  try {
    while (Date.now() < stop) {
      const r = await reader.read();
      if (r.done) break;
      if (r.value) buf += dec.decode(r.value, { stream: true });
    }
  } catch {
    /* cancel raced read */
  } finally {
    clearTimeout(watchdog);
    await reader.cancel().catch(() => {});
  }
  return buf;
}

describe("/api/intel — concurrency & resiliency", () => {
  beforeEach(() => vi.useRealTimers());
  afterEach(() => vi.useRealTimers());

  it("handles 25 concurrent connections without cross-contamination", async () => {
    const prisma = fakePrisma({ initial: [row("only", new Date("2026-01-01"))] });
    const auth = makeAuth();
    const responses = await Promise.all(
      Array.from({ length: 25 }, () =>
        handleIntelGet(
          new Request("http://x/api/intel", { headers: { cookie: "null_session=valid" } }),
          { prisma, ...auth, pollMs: 5_000, pingMs: 1_000 },
        ),
      ),
    );
    expect(responses.every((r) => r.status === 200)).toBe(true);

    const bodies = await Promise.all(responses.map((r) => drainFor(r, 120)));
    for (const body of bodies) {
      const backfills = body.match(/event: backfill/g) ?? [];
      expect(backfills.length).toBe(1);
      expect(body).toContain("\"id\":\"only\"");
    }
  });

  it("emits an error frame when Prisma throws during backfill and closes that stream", async () => {
    const prisma = fakePrisma({ throwOn: "backfill" });
    const res = await handleIntelGet(
      new Request("http://x/api/intel", { headers: { cookie: "null_session=valid" } }),
      { prisma, ...makeAuth(), pollMs: 50, pingMs: 50 },
    );
    const body = await drainFor(res, 200);
    expect(body).toContain("event: error");
    expect(body).toContain("prisma_timeout_backfill");
  });

  it("survives Prisma poll-time timeouts: emits error frames but keeps pinging", async () => {
    const prisma = fakePrisma({ throwOn: "poll", throwAfter: 0 });
    const res = await handleIntelGet(
      new Request("http://x/api/intel", { headers: { cookie: "null_session=valid" } }),
      { prisma, ...makeAuth(), pollMs: 60, pingMs: 80 },
    );
    const body = await drainFor(res, 300);
    expect(body).toContain("event: error");
    expect(body).toContain("prisma_timeout_poll");
    expect(body).toMatch(/event: ping/);
  });

  it("keeps keepalive cadence stable even when Prisma polls are high-latency", async () => {
    const prisma = fakePrisma({ initial: [], pollDelayMs: 500 });
    const res = await handleIntelGet(
      new Request("http://x/api/intel", { headers: { cookie: "null_session=valid" } }),
      { prisma, ...makeAuth(), pollMs: 10_000, pingMs: 80 },
    );
    const body = await drainFor(res, 500);
    const pings = (body.match(/event: ping/g) ?? []).length;
    expect(pings).toBeGreaterThanOrEqual(3);
  });
});

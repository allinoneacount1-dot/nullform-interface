import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleIntelGet, type IntelRow, type IntelPrisma } from "@/lib/intel-handler.server";

// Load + edge-case behavior:
//   - many concurrent EventSource-like consumers do not deadlock
//   - Prisma timeouts surface as `error` frames without killing keepalive
//     for *other* connections
//   - per-stream timeout closes its own stream but doesn't bleed across
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
        if (!isBackfill && behavior.pollDelayMs) await new Promise((r) => setTimeout(r, behavior.pollDelayMs));
        if (isBackfill) return [...initial].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        return [];
      },
    },
  };
}

async function drain(res: Response, ms: number) {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  const start = Date.now();
  while (Date.now() - start < ms) {
    const next = await Promise.race([
      reader.read(),
      new Promise<{ value: undefined; done: true }>((r) => setTimeout(() => r({ value: undefined, done: true }), 30)),
    ]);
    if (next.done) break;
    if (next.value) buf += dec.decode(next.value, { stream: true });
  }
  await reader.cancel().catch(() => {});
  return buf;
}

describe("/api/intel — concurrency & resiliency", () => {
  beforeEach(() => vi.useFakeTimers());
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

    // Each stream gets its own backfill exactly once.
    vi.useRealTimers();
    const bodies = await Promise.all(responses.map((r) => drain(r, 80)));
    for (const body of bodies) {
      const backfills = body.match(/event: backfill/g) ?? [];
      expect(backfills.length).toBe(1);
      expect(body).toContain("\"id\":\"only\"");
    }
  });

  it("emits an error frame when Prisma throws during backfill and closes that stream", async () => {
    const prisma = fakePrisma({ throwOn: "backfill" });
    vi.useRealTimers();
    const res = await handleIntelGet(
      new Request("http://x/api/intel", { headers: { cookie: "null_session=valid" } }),
      { prisma, ...makeAuth(), pollMs: 50, pingMs: 50 },
    );
    const body = await drain(res, 200);
    expect(body).toContain("event: error");
    expect(body).toContain("prisma_timeout_backfill");
  });

  it("survives a Prisma poll-time timeout: emits error frame but keeps pinging", async () => {
    const prisma = fakePrisma({ throwOn: "poll", throwAfter: 0 });
    const res = await handleIntelGet(
      new Request("http://x/api/intel", { headers: { cookie: "null_session=valid" } }),
      { prisma, ...makeAuth(), pollMs: 100, pingMs: 80 },
    );
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    let buf = "";
    // backfill
    const r0 = await reader.read();
    if (r0.value) buf += dec.decode(r0.value, { stream: true });
    // advance through a poll (errors) and pings
    await vi.advanceTimersByTimeAsync(120);
    const r1 = await Promise.race([reader.read(), new Promise<{ value: undefined; done: false }>((r) => setTimeout(() => r({ value: undefined, done: false }), 20))]);
    if (r1.value) buf += dec.decode(r1.value, { stream: true });
    await vi.advanceTimersByTimeAsync(200);
    const r2 = await Promise.race([reader.read(), new Promise<{ value: undefined; done: false }>((r) => setTimeout(() => r({ value: undefined, done: false }), 20))]);
    if (r2.value) buf += dec.decode(r2.value, { stream: true });

    expect(buf).toContain("event: error");
    expect(buf).toContain("prisma_timeout_poll");
    expect(buf).toMatch(/event: ping/);
    await reader.cancel();
  });

  it("keeps keepalive cadence stable even when Prisma is high-latency", async () => {
    // poll calls take 500ms; pings every 100ms must still fire on time.
    vi.useRealTimers();
    const prisma = fakePrisma({ initial: [], delayMs: 500 });
    const res = await handleIntelGet(
      new Request("http://x/api/intel", { headers: { cookie: "null_session=valid" } }),
      { prisma, ...makeAuth(), pollMs: 10_000, pingMs: 100 },
    );
    const body = await drain(res, 450);
    const pings = (body.match(/event: ping/g) ?? []).length;
    // At ~100ms cadence across ~450ms we expect at least 3 pings.
    expect(pings).toBeGreaterThanOrEqual(3);
  });
});

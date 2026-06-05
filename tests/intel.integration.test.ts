import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { handleIntelGet, type IntelRow, type IntelPrisma } from "@/lib/intel-handler.server";

const SECRET = "intel-test-secret-do-not-leak";

function row(partial: Partial<IntelRow> & Pick<IntelRow, "id" | "createdAt">): IntelRow {
  return {
    slot: 1,
    headline: "h",
    body: "body text",
    redactedSpans: [],
    classification: "RESTRICTED",
    ...partial,
  };
}

function makePrisma(initial: IntelRow[]): IntelPrisma & { add(r: IntelRow): void; calls: number } {
  let rows = [...initial];
  let calls = 0;
  return {
    add(r) {
      rows = [r, ...rows];
    },
    get calls() {
      return calls;
    },
    terminalIntel: {
      async findMany(args) {
        calls += 1;
        let res = [...rows];
        if (args?.where?.createdAt?.gt) {
          const gt = args.where.createdAt.gt;
          res = res.filter((r) => r.createdAt > gt);
        }
        res.sort((a, b) =>
          args?.orderBy?.createdAt === "asc"
            ? a.createdAt.getTime() - b.createdAt.getTime()
            : b.createdAt.getTime() - a.createdAt.getTime(),
        );
        if (args?.take) res = res.slice(0, args.take);
        return res;
      },
    },
  } as IntelPrisma & { add(r: IntelRow): void; calls: number };
}

function withAuth(): { verifySession: (t: string | undefined) => { pubkey: string } | null } {
  return {
    verifySession: (token) => (token === "valid" ? { pubkey: "PK" } : null),
  };
}

async function readFrames(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
  buffer: { value: string },
  predicate: () => boolean,
  budgetMs = 1000,
) {
  const start = Date.now();
  while (!predicate() && Date.now() - start < budgetMs) {
    const { value, done } = await Promise.race([
      reader.read(),
      new Promise<{ value: undefined; done: true }>((res) =>
        setTimeout(() => res({ value: undefined, done: true }), 50),
      ),
    ]);
    if (done) break;
    if (value) buffer.value += decoder.decode(value, { stream: true });
  }
}

function parseSSE(raw: string): { event: string | null; data: string }[] {
  return raw
    .split("\n\n")
    .filter(Boolean)
    .map((chunk) => {
      let event: string | null = null;
      const dataLines: string[] = [];
      for (const line of chunk.split("\n")) {
        if (line.startsWith("event: ")) event = line.slice(7);
        else if (line.startsWith("data: ")) dataLines.push(line.slice(6));
      }
      return { event, data: dataLines.join("\n") };
    });
}

describe("/api/intel — auth", () => {
  it("rejects requests without a valid null_session cookie (401)", async () => {
    const prisma = makePrisma([]);
    const res = await handleIntelGet(
      new Request("http://x/api/intel"),
      { prisma, ...withAuth() },
    );
    expect(res.status).toBe(401);
    expect(await res.text()).toBe("unauthorized");
  });

  it("rejects requests with a forged/invalid cookie (401)", async () => {
    const prisma = makePrisma([]);
    const res = await handleIntelGet(
      new Request("http://x/api/intel", {
        headers: { cookie: "null_session=tampered" },
      }),
      { prisma, ...withAuth() },
    );
    expect(res.status).toBe(401);
  });

  it("accepts a valid session and returns text/event-stream", async () => {
    const prisma = makePrisma([]);
    const res = await handleIntelGet(
      new Request("http://x/api/intel", { headers: { cookie: "null_session=valid" } }),
      { prisma, ...withAuth() },
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/event-stream/);
    expect(res.headers.get("cache-control")).toMatch(/no-cache/);
  });
});

describe("/api/intel — framing & cursor", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("emits an initial backfill frame newest-first, then advances cursor", async () => {
    vi.useRealTimers();
    const t0 = new Date("2026-01-01T00:00:00Z");
    const t1 = new Date("2026-01-01T00:00:05Z");
    const t2 = new Date("2026-01-01T00:00:10Z");
    const prisma = makePrisma([
      row({ id: "a", createdAt: t0, body: "alpha" }),
      row({ id: "b", createdAt: t1, body: "bravo" }),
      row({ id: "c", createdAt: t2, body: "charlie" }),
    ]);

    const res = await handleIntelGet(
      new Request("http://x/api/intel", { headers: { cookie: "null_session=valid" } }),
      { prisma, ...withAuth(), pollMs: 30, pingMs: 10_000 },
    );
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    const buf = { value: "" };

    await readFrames(reader, decoder, buf, () => buf.value.includes("\n\n"), 500);
    const frames = parseSSE(buf.value);
    const backfill = frames.find((f) => f.event === "backfill");
    expect(backfill).toBeDefined();
    const payload = JSON.parse(backfill!.data) as IntelRow[];
    expect(payload.map((r) => r.id)).toEqual(["c", "b", "a"]);

    prisma.add(
      row({ id: "d", createdAt: new Date("2026-01-01T00:00:20Z"), body: "delta" }),
    );
    await readFrames(reader, decoder, buf, () => buf.value.includes("\"id\":\"d\""), 500);
    const intels = parseSSE(buf.value).filter((f) => f.event === "intel");
    expect(intels.length).toBe(1);
    expect((JSON.parse(intels[0].data) as IntelRow).id).toBe("d");

    // Cursor advanced: another poll round with no new rows ⇒ still 1 intel frame.
    await readFrames(reader, decoder, buf, () => false, 120);
    const intels2 = parseSSE(buf.value).filter((f) => f.event === "intel");
    expect(intels2.length).toBe(1);

    await reader.cancel();
  });

  it("preserves redactedSpans verbatim in every streamed payload", async () => {
    const spans = [
      { start: 4, end: 10 },
      { start: 18, end: 25 },
    ];
    const prisma = makePrisma([
      row({
        id: "r1",
        createdAt: new Date("2026-02-01T00:00:00Z"),
        body: "the [SECRET] is in [REDACTED] zone",
        redactedSpans: spans,
        classification: "CLASSIFIED",
      }),
    ]);

    const res = await handleIntelGet(
      new Request("http://x/api/intel", { headers: { cookie: "null_session=valid" } }),
      { prisma, ...withAuth(), pollMs: 50, pingMs: 10_000 },
    );
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    const buf = { value: "" };
    await readFrames(reader, decoder, buf, () => buf.value.includes("backfill"));
    const [b] = parseSSE(buf.value).filter((f) => f.event === "backfill");
    const payload = JSON.parse(b.data) as IntelRow[];
    expect(payload[0].redactedSpans).toEqual(spans);
    expect(payload[0].classification).toBe("CLASSIFIED");

    prisma.add(
      row({
        id: "r2",
        createdAt: new Date("2026-02-01T00:00:30Z"),
        body: "follow-up xxxxxx",
        redactedSpans: [{ start: 9, end: 15 }],
      }),
    );
    await vi.advanceTimersByTimeAsync(80);
    await readFrames(reader, decoder, buf, () => buf.value.includes("\"id\":\"r2\""));
    const [i] = parseSSE(buf.value).filter((f) => f.event === "intel");
    const next = JSON.parse(i.data) as IntelRow;
    expect(next.redactedSpans).toEqual([{ start: 9, end: 15 }]);
    await reader.cancel();
  });

  it("emits ping keepalives on the ping interval", async () => {
    const prisma = makePrisma([]);
    const res = await handleIntelGet(
      new Request("http://x/api/intel", { headers: { cookie: "null_session=valid" } }),
      { prisma, ...withAuth(), pollMs: 10_000, pingMs: 200 },
    );
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    const buf = { value: "" };
    await readFrames(reader, decoder, buf, () => buf.value.includes("backfill"));

    await vi.advanceTimersByTimeAsync(250);
    await readFrames(reader, decoder, buf, () => buf.value.includes("event: ping"));
    await vi.advanceTimersByTimeAsync(250);
    await readFrames(reader, decoder, buf, () => (buf.value.match(/event: ping/g) ?? []).length >= 2);

    const pings = (buf.value.match(/event: ping/g) ?? []).length;
    expect(pings).toBeGreaterThanOrEqual(2);
    await reader.cancel();
  });
});

describe("/api/intel — abort", () => {
  it("closes the stream cleanly on request.signal abort", async () => {
    vi.useFakeTimers();
    const prisma = makePrisma([]);
    const ac = new AbortController();
    const res = await handleIntelGet(
      new Request("http://x/api/intel", {
        headers: { cookie: "null_session=valid" },
        signal: ac.signal,
      }),
      { prisma, ...withAuth(), pollMs: 50, pingMs: 50 },
    );
    const reader = res.body!.getReader();
    await reader.read(); // backfill
    ac.abort();
    const after = await Promise.race([
      reader.read(),
      new Promise<{ done: true }>((r) => setTimeout(() => r({ done: true }), 100)),
    ]);
    expect(after.done).toBe(true);
    vi.useRealTimers();
  });
});

import { describe, it, expect } from "vitest";
import { handleIntelGet, type IntelRow, type IntelPrisma } from "@/lib/intel-handler.server";

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
  const stop = Date.now() + budgetMs;
  const watchdog = setTimeout(() => reader.cancel().catch(() => {}), budgetMs);
  try {
    while (!predicate() && Date.now() < stop) {
      const r = await reader.read();
      if (r.done) break;
      if (r.value) buffer.value += decoder.decode(r.value, { stream: true });
    }
  } catch {
    /* watchdog cancelled read */
  } finally {
    clearTimeout(watchdog);
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
      new Request("http://x/api/intel", { headers: { cookie: "null_session=tampered" } }),
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
    await res.body!.cancel();
  });
});

describe("/api/intel — framing & cursor", () => {
  it("emits an initial backfill frame newest-first, then advances cursor", async () => {
    const t0 = new Date("2026-01-01T00:00:00Z");
    const t1 = new Date("2026-01-01T00:00:05Z");
    const t2 = new Date("2026-01-01T00:00:10Z");
    const prisma = makePrisma([
      row({ id: "a", createdAt: t0 }),
      row({ id: "b", createdAt: t1 }),
      row({ id: "c", createdAt: t2 }),
    ]);
    const res = await handleIntelGet(
      new Request("http://x/api/intel", { headers: { cookie: "null_session=valid" } }),
      { prisma, ...withAuth(), pollMs: 40, pingMs: 10_000 },
    );
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    const buf = { value: "" };

    await readFrames(reader, dec, buf, () => buf.value.includes("backfill"), 500);
    const backfill = parseSSE(buf.value).find((f) => f.event === "backfill")!;
    expect((JSON.parse(backfill.data) as IntelRow[]).map((r) => r.id)).toEqual(["c", "b", "a"]);

    prisma.add(row({ id: "d", createdAt: new Date("2026-01-01T00:00:20Z") }));
    await readFrames(reader, dec, buf, () => buf.value.includes('"id":"d"'), 500);
    const intels = parseSSE(buf.value).filter((f) => f.event === "intel");
    expect(intels.length).toBe(1);
    expect((JSON.parse(intels[0].data) as IntelRow).id).toBe("d");

    // No new rows ⇒ cursor prevents duplicate emission across further polls.
    await readFrames(reader, dec, buf, () => false, 200);
    const stillOne = parseSSE(buf.value).filter((f) => f.event === "intel");
    expect(stillOne.length).toBe(1);
  });

  it("preserves redactedSpans and classification verbatim in every streamed payload", async () => {
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
      { prisma, ...withAuth(), pollMs: 30, pingMs: 10_000 },
    );
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    const buf = { value: "" };
    await readFrames(reader, dec, buf, () => buf.value.includes("backfill"), 500);
    const b = parseSSE(buf.value).find((f) => f.event === "backfill")!;
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
    await readFrames(reader, dec, buf, () => buf.value.includes('"id":"r2"'), 500);
    const i = parseSSE(buf.value).find((f) => f.event === "intel")!;
    expect((JSON.parse(i.data) as IntelRow).redactedSpans).toEqual([{ start: 9, end: 15 }]);
  });

  it("emits ping keepalives on the ping interval", async () => {
    const prisma = makePrisma([]);
    const res = await handleIntelGet(
      new Request("http://x/api/intel", { headers: { cookie: "null_session=valid" } }),
      { prisma, ...withAuth(), pollMs: 10_000, pingMs: 80 },
    );
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    const buf = { value: "" };
    await readFrames(
      reader,
      dec,
      buf,
      () => (buf.value.match(/event: ping/g) ?? []).length >= 2,
      500,
    );
    expect((buf.value.match(/event: ping/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
});

describe("/api/intel — abort", () => {
  it("closes the stream cleanly on request.signal abort", async () => {
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
      new Promise<{ done: true }>((r) => setTimeout(() => r({ done: true }), 200)),
    ]);
    expect(after.done).toBe(true);
  });
});

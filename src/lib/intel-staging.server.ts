// Staging fallback "Prisma" for /api/intel. Activated when
// PRISMA_ACCELERATE_URL is missing or still a placeholder. Streams correctly
// shaped TerminalIntel rows so the SSE frame contract (backfill / intel /
// ping / error) stays observable end-to-end without a live database.

import type { IntelPrisma, IntelRow } from "./intel-handler.server";

const CLASSES: IntelRow["classification"][] = ["PUBLIC", "RESTRICTED", "CLASSIFIED", "REDACTED"];

const SEED: Omit<IntelRow, "id" | "createdAt">[] = [
  {
    slot: 1,
    headline: "STAGING // SIGINT CHATTER",
    body: "Intercepted burst from node-7. Operator handle was [REDACTED] and the rendezvous coords are [REDACTED] at 0400Z.",
    redactedSpans: [
      { start: 39, end: 49 },
      { start: 80, end: 90 },
    ],
    classification: "CLASSIFIED",
  },
  {
    slot: 2,
    headline: "STAGING // OPEN BAND",
    body: "Surface relay nominal. No anomalies in the last polling window.",
    redactedSpans: [],
    classification: "PUBLIC",
  },
  {
    slot: 3,
    headline: "STAGING // PURGE LEDGER",
    body: "Sigil [REDACTED] committed at slot drift +12. Acknowledged by witness ring.",
    redactedSpans: [{ start: 6, end: 16 }],
    classification: "RESTRICTED",
  },
];

let counter = 0;
function makeRow(seed: Omit<IntelRow, "id" | "createdAt">, when: Date): IntelRow {
  counter += 1;
  return {
    ...seed,
    id: `staging-${when.getTime()}-${counter}`,
    createdAt: when,
  };
}

export function createStagingPrisma(): IntelPrisma {
  // Backfill: three seed rows, descending by createdAt.
  const now = Date.now();
  const backfill: IntelRow[] = SEED.map((s, i) => makeRow(s, new Date(now - (i + 1) * 1000)));
  // Live emissions begin after `started`; one synthetic row every ~6s.
  const started = new Date(now);

  return {
    terminalIntel: {
      async findMany(args) {
        const order = args.orderBy?.createdAt ?? "desc";
        const take = args.take ?? 20;
        if (!args.where?.createdAt?.gt) {
          // backfill path
          const rows = [...backfill].sort((a, b) =>
            order === "desc"
              ? b.createdAt.getTime() - a.createdAt.getTime()
              : a.createdAt.getTime() - b.createdAt.getTime(),
          );
          return rows.slice(0, take);
        }
        // polling path: emit a fresh synthetic row at most every ~6s
        const gt = args.where.createdAt.gt;
        const elapsed = Date.now() - Math.max(gt.getTime(), started.getTime());
        if (elapsed < 6_000) return [];
        const seed = SEED[Math.floor(Math.random() * SEED.length)];
        const next = makeRow(
          { ...seed, classification: CLASSES[Math.floor(Math.random() * CLASSES.length)] },
          new Date(),
        );
        return [next];
      },
    },
  };
}

export function isPrismaConfigured(): boolean {
  const v = process.env.PRISMA_ACCELERATE_URL;
  return !!v && v.length > 16 && v.startsWith("prisma://");
}

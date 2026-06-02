import { createServerFn } from "./react-start-stub";
import { z } from "zod";
import { getPrisma } from "./prisma.server";

// Server function used by IntelHorizon to seed sample TerminalIntel rows
// for the redacted-block UI. In production these would be inserted by an
// indexer / governance bot, not by clients — keep behind SIWS auth.

const RedactedSpan = z.object({ start: z.number().int().min(0), end: z.number().int().min(1) });

export const seedIntel = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      headline: z.string().min(1).max(120),
      body: z.string().min(1).max(2_000),
      slot: z.number().int().nullable().optional(),
      redactedSpans: z.array(RedactedSpan).max(20).optional(),
      classification: z.enum(["PUBLIC", "RESTRICTED", "CLASSIFIED", "REDACTED"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const prisma = getPrisma();
    const row = await prisma.terminalIntel.create({
      data: {
        headline: data.headline,
        body: data.body,
        slot: data.slot ?? null,
        redactedSpans: data.redactedSpans ?? [],
        classification: data.classification ?? "RESTRICTED",
      },
    });
    return { id: row.id, createdAt: row.createdAt };
  });

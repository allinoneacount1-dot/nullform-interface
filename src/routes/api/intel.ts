import { createFileRoute } from "@tanstack/react-router";
import { verifyNullSession } from "@/lib/session.server";
import { getPrisma } from "@/lib/prisma.server";
import { handleIntelGet } from "@/lib/intel-handler.server";
import { createStagingPrisma, isPrismaConfigured } from "@/lib/intel-staging.server";

// Authenticated Server-Sent Events stream of TerminalIntel rows.
// Logic lives in src/lib/intel-handler.server.ts so it can be tested
// with a fake Prisma + session verifier. When PRISMA_ACCELERATE_URL is
// missing/placeholder, fall back to a staging in-memory source so the
// SSE frame contract remains observable end-to-end.

export const Route = createFileRoute("/api/intel")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const prisma = isPrismaConfigured()
          ? (getPrisma() as never)
          : (createStagingPrisma() as never);
        return handleIntelGet(request, {
          prisma,
          verifySession: verifyNullSession,
        });
      },
    },
  },
});

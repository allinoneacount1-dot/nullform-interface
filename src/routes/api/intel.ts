import { createFileRoute } from "@tanstack/react-router";
import { verifyNullSession } from "@/lib/session.server";
import { getPrisma } from "@/lib/prisma.server";
import { handleIntelGet } from "@/lib/intel-handler.server";

// Authenticated Server-Sent Events stream of TerminalIntel rows.
// Logic lives in src/lib/intel-handler.server.ts so it can be tested
// with a fake Prisma + session verifier.

export const Route = createFileRoute("/api/intel")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        handleIntelGet(request, {
          prisma: getPrisma() as never,
          verifySession: verifyNullSession,
        }),
    },
  },
});

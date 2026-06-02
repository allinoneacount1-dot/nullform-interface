import { createFileRoute } from "@tanstack/react-router";
import { Connection } from "@solana/web3.js";
import { verifyNullSession } from "@/lib/session.server";
import { redis } from "@/lib/upstash.server";
import { handlePurgePost } from "@/lib/purge-handler.server";

export const Route = createFileRoute("/api/purge")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rpcUrl = process.env.SOLANA_RPC_HTTP_URL ?? "https://api.mainnet-beta.solana.com";
        const conn = new Connection(rpcUrl, "confirmed");
        return handlePurgePost(request, {
          redis,
          verifySession: verifyNullSession,
          getAccountInfo: async (_target, pk) => {
            const [info, slot] = await Promise.all([
              conn.getAccountInfo(pk, "confirmed"),
              conn.getSlot("confirmed").catch(() => null),
            ]);
            return { info, slot };
          },
          now: () => Date.now(),
          randomId: () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
        });
      },
    },
  },
});

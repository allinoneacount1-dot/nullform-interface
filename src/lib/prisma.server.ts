// Prisma client for the Cloudflare Workers SSR runtime.
// Uses the edge build + Accelerate extension so the connection-pooled,
// HTTP-based driver works without Node net/tls. PRISMA_ACCELERATE_URL is the
// "prisma://accelerate.prisma-data.net/?api_key=..." string from the
// Accelerate dashboard. We do NOT pass DATABASE_URL at runtime — that's only
// used by `prisma migrate` / `prisma db push` at build time.

import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

let cached: ReturnType<typeof build> | undefined;

function build() {
  const url = process.env.PRISMA_ACCELERATE_URL;
  if (!url) throw new Error("PRISMA_ACCELERATE_URL not configured");
  return new PrismaClient({ datasourceUrl: url }).$extends(withAccelerate());
}

export function getPrisma() {
  if (!cached) cached = build();
  return cached;
}

export type Prisma = ReturnType<typeof getPrisma>;

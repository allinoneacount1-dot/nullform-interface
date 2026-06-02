import { b as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { c as createRouter, a as createRootRouteWithContext, u as useRouter, L as Link, O as Outlet, H as HeadContent, S as Scripts, b as createFileRoute, l as lazyRouteComponent } from "../_libs/tanstack__react-router.mjs";
import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { C as Connection, P as PublicKey } from "../_libs/solana__web3.js.mjs";
import { createHmac, timingSafeEqual } from "node:crypto";
import { r as redis } from "./upstash.server-ku1_woMB.mjs";
import { PrismaClient } from "@prisma/client/edge";
import { k } from "../_libs/prisma__extension-accelerate.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "crypto";
import "async_hooks";
import "util";
import "stream";
import "../_libs/isbot.mjs";
import "buffer";
import "../_libs/noble__curves.mjs";
import "../_libs/noble__hashes.mjs";
import "../_libs/bn.js.mjs";
import "../_libs/bs58.mjs";
import "../_libs/base-x.mjs";
import "../_libs/safe-buffer.mjs";
import "../_libs/borsh.mjs";
import "../_libs/text-encoding-utf-8.mjs";
import "../_libs/solana__buffer-layout.mjs";
import "../_libs/solana__codecs-numbers.mjs";
import "../_libs/solana__errors.mjs";
import "../_libs/solana__codecs-core.mjs";
import "http";
import "https";
import "../_libs/superstruct.mjs";
import "../_libs/jayson.mjs";
import "../_libs/uuid.mjs";
import "../_libs/node-fetch.mjs";
import "url";
import "../_libs/whatwg-url.mjs";
import "../_libs/webidl-conversions.mjs";
import "punycode";
import "../_libs/tr46.mjs";
import "zlib";
import "../_libs/rpc-websockets.mjs";
import "../_libs/ws.mjs";
import "events";
import "net";
import "tls";
import "../_libs/bufferutil.mjs";
import "../_libs/node-gyp-build.mjs";
import "fs";
import "path";
import "os";
import "../_libs/tweetnacl.mjs";
import "../_libs/utf-8-validate.mjs";
import "../_libs/eventemitter3.mjs";
import "@prisma/client/scripts/default-index.js";
const appCss = "/assets/styles-Gf3JxCui.css";
function reportLovableError(error, context = {}) {
  if (typeof window === "undefined") return;
  window.__lovableEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error"
    }
  );
}
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router = useRouter();
  reactExports.useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "This page didn't load" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Something went wrong on our end. You can try refreshing or head back home." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            router.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$3 = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "NULL FORM // SYS_RESET" },
      { name: "description", content: "$NULL — the cult of the void. SIWS auth, live RPC stream, Jupiter V6." },
      { name: "theme-color", content: "#050505" },
      { property: "og:title", content: "NULL FORM // SYS_RESET" },
      { property: "og:description", content: "$NULL — the cult of the void. SIWS auth, live RPC stream, Jupiter V6." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "NULL FORM // SYS_RESET" },
      { name: "twitter:description", content: "$NULL — the cult of the void. SIWS auth, live RPC stream, Jupiter V6." }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$3.useRouteContext();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) });
}
const $$splitComponentImporter = () => import("./index-aKRbIfYp.mjs");
const Route$2 = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "NULL FORM // SYS_RESET"
    }, {
      name: "description",
      content: "$NULL — cyber-cult terminal void. Confirm you are nothing."
    }, {
      property: "og:title",
      content: "NULL FORM // SYS_RESET"
    }, {
      property: "og:description",
      content: "Live RPC stream. SIWS auth. Jupiter V6. ∅"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
function verifyNullSession(token) {
  if (!token) return null;
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    if (typeof payload.pubkey !== "string") return null;
    return payload;
  } catch {
    return null;
  }
}
const PURGE_LEDGER_KEY = "null:purge:ledger";
const PURGE_SEEN_KEY = "null:purge:targets";
const PURGE_RATE_LIMIT = 5;
const PURGE_RATE_WINDOW_SEC = 60 * 60;
async function processPurge(input, deps) {
  let rl;
  try {
    rl = await deps.redis.rateLimit(
      `null:rl:purge:${input.pubkey}`,
      PURGE_RATE_LIMIT,
      PURGE_RATE_WINDOW_SEC
    );
  } catch (e) {
    return { ok: false, status: 503, error: "rate_limit_unavailable", detail: e.message };
  }
  if (!rl.allowed) {
    return { ok: false, status: 429, error: "rate_limited", resetMs: rl.resetMs };
  }
  let acc;
  try {
    acc = await deps.getAccountInfo(input.target);
  } catch (e) {
    return { ok: false, status: 502, error: "rpc_failure", detail: e.message };
  }
  if (!acc.info) return { ok: false, status: 404, error: "account_not_found" };
  if (acc.info.lamports === 0) return { ok: false, status: 410, error: "account_already_void" };
  const member = `${input.pubkey}:${input.target}`;
  try {
    const exists = await deps.redis.sismember(PURGE_SEEN_KEY, member);
    if (exists === 1) return { ok: false, status: 409, error: "already_purged" };
    await deps.redis.sadd(PURGE_SEEN_KEY, member);
  } catch {
  }
  const ts = deps.now();
  const entry = {
    signature: deps.randomId(),
    pubkey: input.pubkey,
    target: input.target,
    slot: acc.slot,
    ownerProgram: acc.info.owner.toBase58(),
    lamports: acc.info.lamports,
    ts,
    note: input.note ?? null
  };
  try {
    await deps.redis.zadd(PURGE_LEDGER_KEY, ts, JSON.stringify(entry));
  } catch (e) {
    return { ok: false, status: 500, error: "ledger_write_failed", detail: e.message };
  }
  return { ok: true, entry };
}
const PurgeBody = objectType({
  target: stringType().min(32).max(64).regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "invalid_base58"),
  note: stringType().trim().max(140).optional()
});
function json(body, status = 200, extra) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...extra ?? {} }
  });
}
function parseCookie$1(header, name) {
  if (!header) return void 0;
  for (const part of header.split(";")) {
    const [k2, ...rest] = part.trim().split("=");
    if (k2 === name) return decodeURIComponent(rest.join("="));
  }
  return void 0;
}
async function handlePurgePost(request, deps) {
  const sess = deps.verifySession(parseCookie$1(request.headers.get("cookie"), "null_session"));
  if (!sess) return json({ error: "unauthorized" }, 401);
  let parsed;
  try {
    parsed = PurgeBody.parse(await request.json());
  } catch (e) {
    return json({ error: "bad_request", detail: e.message }, 400);
  }
  let targetPk;
  try {
    targetPk = new PublicKey(parsed.target);
  } catch {
    return json({ error: "invalid_pubkey" }, 400);
  }
  const result = await processPurge(
    { pubkey: sess.pubkey, target: parsed.target, note: parsed.note },
    {
      redis: deps.redis,
      getAccountInfo: () => deps.getAccountInfo(parsed.target, targetPk),
      now: deps.now,
      randomId: deps.randomId
    }
  );
  if (!result.ok) {
    const extra = {};
    if (result.error === "rate_limited" && result.resetMs) {
      extra["retry-after"] = String(Math.ceil(result.resetMs / 1e3));
      extra["x-ratelimit-remaining"] = "0";
    }
    return json(
      {
        error: result.error,
        ...result.resetMs ? { resetMs: result.resetMs } : {},
        ...result.detail ? { detail: result.detail } : {}
      },
      result.status,
      extra
    );
  }
  return json({ ok: true, entry: result.entry });
}
const Route$1 = createFileRoute("/api/purge")({
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
              conn.getSlot("confirmed").catch(() => null)
            ]);
            return { info, slot };
          },
          now: () => Date.now(),
          randomId: () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
        });
      }
    }
  }
});
let cached;
function build() {
  const url = process.env.PRISMA_ACCELERATE_URL;
  if (!url) throw new Error("PRISMA_ACCELERATE_URL not configured");
  return new PrismaClient({ datasourceUrl: url }).$extends(k());
}
function getPrisma() {
  if (!cached) cached = build();
  return cached;
}
const POLL_MS = 2e3;
const PING_MS = 15e3;
function parseCookie(header, name) {
  if (!header) return void 0;
  for (const part of header.split(";")) {
    const [k2, ...rest] = part.trim().split("=");
    if (k2 === name) return decodeURIComponent(rest.join("="));
  }
  return void 0;
}
function sse(event, data) {
  const lines = [];
  if (event) lines.push(`event: ${event}`);
  lines.push(`data: ${JSON.stringify(data)}`);
  lines.push("", "");
  return lines.join("\n");
}
const Route = createFileRoute("/api/intel")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const sess = verifyNullSession(parseCookie(request.headers.get("cookie"), "null_session"));
        if (!sess) return new Response("unauthorized", { status: 401 });
        const encoder = new TextEncoder();
        const prisma = getPrisma();
        const stream = new ReadableStream({
          async start(controller) {
            const send = (event, data) => controller.enqueue(encoder.encode(sse(event, data)));
            let cursor = /* @__PURE__ */ new Date(0);
            let closed = false;
            const close = () => {
              if (closed) return;
              closed = true;
              try {
                controller.close();
              } catch {
              }
            };
            request.signal.addEventListener("abort", close);
            try {
              const rows = await prisma.terminalIntel.findMany({
                orderBy: { createdAt: "desc" },
                take: 20
              });
              send("backfill", rows);
              if (rows.length) cursor = rows[0].createdAt;
            } catch (e) {
              send("error", { message: e.message });
              close();
              return;
            }
            const pingInterval = setInterval(() => {
              if (closed) return;
              try {
                controller.enqueue(encoder.encode(`event: ping
data: ${Date.now()}

`));
              } catch {
                close();
              }
            }, PING_MS);
            const pollInterval = setInterval(async () => {
              if (closed) return;
              try {
                const rows = await prisma.terminalIntel.findMany({
                  where: { createdAt: { gt: cursor } },
                  orderBy: { createdAt: "asc" },
                  take: 50
                });
                for (const r of rows) {
                  send("intel", r);
                  if (r.createdAt > cursor) cursor = r.createdAt;
                }
              } catch (e) {
                send("error", { message: e.message });
              }
            }, POLL_MS);
            request.signal.addEventListener("abort", () => {
              clearInterval(pingInterval);
              clearInterval(pollInterval);
            });
          }
        });
        return new Response(stream, {
          status: 200,
          headers: {
            "content-type": "text/event-stream; charset=utf-8",
            "cache-control": "no-cache, no-transform",
            connection: "keep-alive",
            "x-accel-buffering": "no"
          }
        });
      }
    }
  }
});
const IndexRoute = Route$2.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$3
});
const ApiPurgeRoute = Route$1.update({
  id: "/api/purge",
  path: "/api/purge",
  getParentRoute: () => Route$3
});
const ApiIntelRoute = Route.update({
  id: "/api/intel",
  path: "/api/intel",
  getParentRoute: () => Route$3
});
const rootRouteChildren = {
  IndexRoute,
  ApiIntelRoute,
  ApiPurgeRoute
};
const routeTree = Route$3._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router;
};
export {
  getRouter
};

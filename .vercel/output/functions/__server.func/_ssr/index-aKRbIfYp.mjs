import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { u as useQuery, a as useQueryClient, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { a as bs58 } from "../_libs/bs58.mjs";
import { a as createServerFn, T as TSS_SERVER_FUNCTION, b as getServerFnById } from "./server-cZkq-rCv.mjs";
import { C as Connection, P as PublicKey, a as VersionedTransaction } from "../_libs/solana__web3.js.mjs";
import { Buffer } from "buffer";
import "../_libs/seroval.mjs";
import { P as PhantomWalletAdapter } from "../_libs/solana__wallet-adapter-phantom.mjs";
import { S as SolflareWalletAdapter } from "../_libs/@solana/wallet-adapter-solflare+[...].mjs";
import { B as BackpackWalletAdapter } from "../_libs/@solana/wallet-adapter-backpack+[...].mjs";
import { C as ConnectionProvider, W as WalletProvider, u as useWallet, a as useConnection } from "../_libs/solana__wallet-adapter-react.mjs";
import { o as objectType, s as stringType, n as numberType } from "../_libs/zod.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/base-x.mjs";
import "../_libs/safe-buffer.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:stream";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "crypto";
import "async_hooks";
import "util";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/noble__curves.mjs";
import "../_libs/noble__hashes.mjs";
import "node:crypto";
import "../_libs/bn.js.mjs";
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
import "../_libs/solana__wallet-adapter-base.mjs";
import "../_libs/wallet-standard__features.mjs";
import "../_libs/@solana/wallet-standard-features+[...].mjs";
import "../_libs/@solana-mobile/wallet-adapter-mobile+[...].mjs";
import "../_libs/@solana-mobile/wallet-standard-mobile+[...].mjs";
import "../_libs/@solana-mobile/mobile-wallet-adapter-protocol+[...].mjs";
import "../_libs/solana__codecs-strings.mjs";
import "../_libs/solana__wallet-standard-util.mjs";
import "../_libs/solana__wallet-standard-chains.mjs";
import "../_libs/qrcode.mjs";
import "../_libs/dijkstrajs.mjs";
import "../_libs/pngjs.mjs";
import "assert";
import "../_libs/@solana/wallet-standard-wallet-adapter-react+[...].mjs";
import "../_libs/wallet-standard__app.mjs";
import "../_libs/@solana/wallet-standard-wallet-adapter-base+[...].mjs";
import "../_libs/wallet-standard__wallet.mjs";
function NullCanvas() {
  const ref = reactExports.useRef(null);
  reactExports.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, cols = 0;
    const FONT = 14;
    let drops = [];
    const glyphs = "01∅0xNULLΣΛΘΦΞΩ⌬⏚░▓".split("");
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / FONT);
      drops = Array.from({ length: cols }, () => Math.random() * h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    let raf = 0;
    let last = 0;
    const FRAME = 1e3 / 9;
    const tick = (t) => {
      raf = requestAnimationFrame(tick);
      if (t - last < FRAME) return;
      last = t;
      ctx.fillStyle = "rgba(5,5,5,0.18)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${FONT}px JetBrains Mono, ui-monospace, monospace`;
      for (let i = 0; i < cols; i++) {
        const ch = glyphs[Math.random() * glyphs.length | 0];
        const x = i * FONT;
        const y = drops[i];
        const head = Math.random() < 0.04;
        ctx.fillStyle = head ? "rgba(245,245,245,0.85)" : Math.random() < 0.06 ? "rgba(180,255,80,0.55)" : "rgba(140,140,170,0.35)";
        ctx.fillText(ch, x, y);
        drops[i] = y > h + Math.random() * 200 ? 0 : y + FONT;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "canvas",
    {
      ref,
      "aria-hidden": true,
      className: "pointer-events-none fixed inset-0 h-full w-full opacity-[0.35] crt-flicker"
    }
  );
}
var createSsrRpc = (functionId) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    return (await getServerFnById(functionId))(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const getAuthNonce = createServerFn({
  method: "POST"
}).inputValidator(objectType({
  pubkey: stringType().min(32).max(64)
})).handler(createSsrRpc("0fd86b915028ec21790ba6558b0606712c2c00b85e9c28b145055e250507412f"));
const verifyAuthSignature = createServerFn({
  method: "POST"
}).inputValidator(objectType({
  pubkey: stringType().min(32).max(64),
  signature: stringType().min(40).max(200),
  // base58
  message: stringType().min(40).max(1024)
})).handler(createSsrRpc("887db650779822a61d54615421fd86dab087e8c362a1b2971ac608e3eaf93a51"));
const getAuthSession = createServerFn({
  method: "GET"
}).handler(createSsrRpc("b28c72d5c19cb2360284b3c0a6709dcb8ad013f29a442bb69f315fd7d0d80e38"));
const logoutAuth = createServerFn({
  method: "POST"
}).handler(createSsrRpc("e48a6d946cd46f8952216be2bd7226ffa0493fbdf8e353305c5e102ae216f085"));
function short$1(pk) {
  return `${pk.slice(0, 4)}…${pk.slice(-4)}`;
}
function SiwsGate() {
  const { wallets, select, connect, disconnect, connected, publicKey, signMessage, wallet } = useWallet();
  const [picker, setPicker] = reactExports.useState(false);
  const qc = useQueryClient();
  const session = useQuery({
    queryKey: ["auth-session"],
    queryFn: () => getAuthSession(),
    staleTime: 3e4
  });
  reactExports.useEffect(() => {
    if (wallet && !connected) connect().catch(() => {
    });
  }, [wallet, connected, connect]);
  const sign = useMutation({
    mutationFn: async () => {
      if (!publicKey || !signMessage) throw new Error("wallet_unavailable");
      const pubkey = publicKey.toBase58();
      const { message } = await getAuthNonce({ data: { pubkey } });
      const sig = await signMessage(new TextEncoder().encode(message));
      const signature = bs58.encode(sig);
      return verifyAuthSignature({ data: { pubkey, signature, message } });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth-session"] })
  });
  const onLogout = reactExports.useCallback(async () => {
    await logoutAuth();
    await disconnect().catch(() => {
    });
    qc.invalidateQueries({ queryKey: ["auth-session"] });
  }, [disconnect, qc]);
  const authed = !!session.data?.pubkey;
  if (authed) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-[11px] uppercase tracking-[0.25em]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-glow-acid", children: "◉ AUTH_OK" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: short$1(session.data.pubkey) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-cult", onClick: onLogout, children: "SEVER_LINK" })
    ] });
  }
  if (!connected) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btn-cult", onClick: () => setPicker((v) => !v), children: "⏚ INITIATE_LINK" }),
      picker && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-0 z-30 mt-2 w-64 frame-cult p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-2 pb-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground", children: "select_vessel" }),
        wallets.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-2 py-3 text-[11px] text-muted-foreground", children: "no wallets detected" }),
        wallets.map((w) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: async () => {
              select(w.adapter.name);
              setPicker(false);
            },
            className: "flex w-full items-center justify-between px-2 py-2 text-left text-[12px] uppercase tracking-[0.2em] hover:bg-secondary",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: w.adapter.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground", children: w.readyState })
            ]
          },
          w.adapter.name
        ))
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] uppercase tracking-[0.25em] text-muted-foreground", children: publicKey ? short$1(publicKey.toBase58()) : "—" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        className: "btn-cult",
        onClick: () => sign.mutate(),
        disabled: sign.isPending,
        style: { boxShadow: "var(--shadow-glow-violet)" },
        children: sign.isPending ? "AWAIT_SIG…" : "CONFIRM YOU ARE NOTHING"
      }
    ),
    sign.isError && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase tracking-[0.2em] text-destructive", children: "REJECTED" })
  ] });
}
const getNullConfig = createServerFn({
  method: "GET"
}).handler(createSsrRpc("458ca223179642a618852e7e6a915ebc4c5aa34505b0ff6783fd7fe509e0c46e"));
function EventHorizon() {
  const { data: cfg } = useQuery({ queryKey: ["null-config"], queryFn: () => getNullConfig(), staleTime: Infinity });
  const [events, setEvents] = reactExports.useState([]);
  const [status, setStatus] = reactExports.useState("booting");
  const seen = reactExports.useRef(/* @__PURE__ */ new Set());
  reactExports.useEffect(() => {
    if (!cfg?.rpcHttp) return;
    let cancelled = false;
    let subId = null;
    let pollTimer = null;
    const conn = new Connection(cfg.rpcHttp, {
      commitment: "confirmed",
      wsEndpoint: cfg.rpcWs || void 0
    });
    const push = (sig, slot, err) => {
      if (seen.current.has(sig)) return;
      seen.current.add(sig);
      setEvents((prev) => [{ sig, slot, t: Date.now(), err }, ...prev].slice(0, 50));
    };
    const startPolling = () => {
      setStatus("polling");
      if (!cfg.mint) return;
      let lastSig;
      const poll = async () => {
        try {
          const sigs = await conn.getSignaturesForAddress(new PublicKey(cfg.mint), { limit: 8 }, "confirmed");
          for (const s of sigs.reverse()) {
            if (s.signature === lastSig) continue;
            push(s.signature, s.slot, !!s.err);
          }
          if (sigs[0]) lastSig = sigs[0].signature;
        } catch {
          setStatus("down");
        }
      };
      poll();
      pollTimer = setInterval(poll, 6e3);
    };
    const start = async () => {
      if (!cfg.mint) {
        setStatus("down");
        return;
      }
      try {
        const mintPk = new PublicKey(cfg.mint);
        subId = conn.onLogs(
          mintPk,
          (logs, ctx) => {
            if (cancelled) return;
            push(logs.signature, ctx.slot, !!logs.err);
          },
          "confirmed"
        );
        setStatus("live");
      } catch {
        startPolling();
      }
    };
    start();
    return () => {
      cancelled = true;
      if (subId !== null) conn.removeOnLogsListener(subId).catch(() => {
      });
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [cfg?.rpcHttp, cfg?.rpcWs, cfg?.mint]);
  const dot = status === "live" ? "bg-[color:var(--null-acid)]" : status === "polling" ? "bg-[color:var(--null-azure)]" : status === "down" ? "bg-destructive" : "bg-muted-foreground";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "frame-cult p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "mb-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `h-2 w-2 rounded-full ${dot}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-[11px] uppercase tracking-[0.4em] text-glow-bone", children: "EVENT_HORIZON // LIVE_RPC" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase tracking-[0.3em] text-muted-foreground", children: status === "live" ? "ws_subscribed" : status === "polling" ? "fallback_poll" : status === "down" ? "channel_lost" : "booting" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-[80px_1fr_90px] gap-x-4 border-b border-border pb-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "slot" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "signature" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-right", children: "state" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "mt-1 max-h-[280px] overflow-hidden", children: [
      events.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "py-6 text-center text-[11px] uppercase tracking-[0.3em] text-muted-foreground", children: "…awaiting first transmission" }),
      events.map((e) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "li",
        {
          className: "grid grid-cols-[80px_1fr_90px] gap-x-4 border-b border-border/40 py-1.5 text-[11px]",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: e.slot }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "a",
              {
                href: `https://solscan.io/tx/${e.sig}`,
                target: "_blank",
                rel: "noreferrer",
                className: "truncate font-mono text-glow-bone hover:text-glow-violet",
                children: e.sig
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-right ${e.err ? "text-destructive" : "text-glow-acid"}`, children: e.err ? "FAIL" : "OK" })
          ]
        },
        e.sig
      ))
    ] })
  ] });
}
const SOL_MINT = "So11111111111111111111111111111111111111112";
function JupiterSwap() {
  const { data: cfg } = useQuery({ queryKey: ["null-config"], queryFn: () => getNullConfig(), staleTime: Infinity });
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [solAmount, setSolAmount] = reactExports.useState("0.05");
  const [slippageBps, setSlippageBps] = reactExports.useState(150);
  const [quote, setQuote] = reactExports.useState(null);
  const [quoteErr, setQuoteErr] = reactExports.useState(null);
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [txSig, setTxSig] = reactExports.useState(null);
  const lamports = reactExports.useMemo(() => {
    const n = Number(solAmount);
    if (!isFinite(n) || n <= 0) return 0;
    return Math.floor(n * 1e9);
  }, [solAmount]);
  reactExports.useEffect(() => {
    if (!cfg?.mint || lamports <= 0) {
      setQuote(null);
      return;
    }
    let aborted = false;
    setQuoteErr(null);
    const url = `https://lite-api.jup.ag/swap/v1/quote?inputMint=${SOL_MINT}&outputMint=${cfg.mint}&amount=${lamports}&slippageBps=${slippageBps}&swapMode=ExactIn`;
    fetch(url).then((r) => r.ok ? r.json() : Promise.reject(new Error(`quote_${r.status}`))).then((q) => {
      if (!aborted) setQuote(q);
    }).catch((e) => {
      if (!aborted) {
        setQuote(null);
        setQuoteErr(String(e.message || e));
      }
    });
    return () => {
      aborted = true;
    };
  }, [cfg?.mint, lamports, slippageBps]);
  const onSwap = async () => {
    if (!publicKey || !signTransaction || !quote) return;
    setSubmitting(true);
    setTxSig(null);
    try {
      const r = await fetch("https://lite-api.jup.ag/swap/v1/swap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: publicKey.toBase58(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: { priorityLevelWithMaxLamports: { maxLamports: 4e6, priorityLevel: "high" } }
        })
      });
      if (!r.ok) throw new Error(`swap_${r.status}`);
      const { swapTransaction } = await r.json();
      const bin = Uint8Array.from(atob(swapTransaction), (c) => c.charCodeAt(0));
      const tx = VersionedTransaction.deserialize(bin);
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize(), { maxRetries: 3 });
      setTxSig(sig);
    } catch (e) {
      setQuoteErr(String(e.message));
    } finally {
      setSubmitting(false);
    }
  };
  const outFmt = quote ? (Number(quote.outAmount) / 1e6).toLocaleString(void 0, { maximumFractionDigits: 4 }) : "—";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "frame-cult p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "mb-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-[11px] uppercase tracking-[0.4em] text-glow-bone", children: "JUPITER_V6 // EXEC_SWAP" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase tracking-[0.3em] text-glow-violet", children: "SOL → ∅NULL" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block pb-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground", children: "offer (SOL)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            value: solAmount,
            onChange: (e) => setSolAmount(e.target.value.replace(/[^0-9.]/g, "")),
            className: "w-full border border-border bg-input px-3 py-3 font-mono text-lg text-glow-bone outline-none focus:border-[color:var(--null-violet)]"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block pb-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground", children: "slippage (bps)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "number",
            min: 10,
            max: 1e3,
            value: slippageBps,
            onChange: (e) => setSlippageBps(Math.max(10, Math.min(1e3, Number(e.target.value) || 150))),
            className: "w-full border border-border bg-input px-3 py-3 font-mono text-lg text-glow-bone outline-none focus:border-[color:var(--null-violet)]"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid grid-cols-3 gap-3 border-y border-border py-3 text-[11px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-[0.3em] text-muted-foreground", children: "receive" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-glow-acid", children: outFmt })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-[0.3em] text-muted-foreground", children: "impact" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono", children: quote ? `${(Number(quote.priceImpactPct) * 100).toFixed(3)}%` : "—" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-[0.3em] text-muted-foreground", children: "route" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate font-mono text-glow-violet", children: quote?.routePlan?.map((r) => r.swapInfo.label).filter(Boolean).join(" → ") || "—" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: "btn-cult",
          disabled: !publicKey || !quote || submitting,
          onClick: onSwap,
          style: { boxShadow: quote ? "var(--shadow-glow-acid)" : void 0 },
          children: submitting ? "TRANSMITTING…" : publicKey ? "EXECUTE_DESCENT" : "AWAIT_LINK"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-right text-[10px] uppercase tracking-[0.25em]", children: txSig ? /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `https://solscan.io/tx/${txSig}`, target: "_blank", rel: "noreferrer", className: "text-glow-acid", children: "view_signature ↗" }) : quoteErr ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-destructive", children: quoteErr }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "awaiting_intent" }) })
    ] })
  ] });
}
function Redacted({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "redacted", children });
}
if (typeof globalThis !== "undefined" && !globalThis.Buffer) {
  globalThis.Buffer = Buffer;
}
function NullWalletProvider({ children }) {
  const { data } = useQuery({
    queryKey: ["null-config"],
    queryFn: () => getNullConfig(),
    staleTime: Infinity
  });
  const wallets = reactExports.useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new BackpackWalletAdapter()],
    []
  );
  const endpoint = data?.rpcHttp ?? "https://api.mainnet-beta.solana.com";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ConnectionProvider, { endpoint, config: { commitment: "confirmed", wsEndpoint: data?.rpcWs }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(WalletProvider, { wallets, autoConnect: true, children }) });
}
const getPurgeFeed = createServerFn({
  method: "GET"
}).inputValidator(objectType({
  limit: numberType().min(1).max(50).optional()
})).handler(createSsrRpc("0ac11fbf6bd3b8662d49e4bd2e6785181eaad15f270999afe690476db770dc59"));
function short(s, head = 4, tail = 4) {
  return s.length > head + tail + 1 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s;
}
async function submitPurge(body) {
  const res = await fetch("/api/purge", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include"
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(json.error ?? `http_${res.status}`);
  return json.entry;
}
function PurgeProtocol() {
  const qc = useQueryClient();
  const [target, setTarget] = reactExports.useState("");
  const [note, setNote] = reactExports.useState("");
  const session = useQuery({ queryKey: ["auth-session"], queryFn: () => getAuthSession() });
  const feed = useQuery({
    queryKey: ["purge-feed"],
    queryFn: () => getPurgeFeed({ data: { limit: 12 } }),
    refetchInterval: 15e3
  });
  const purge = useMutation({
    mutationFn: submitPurge,
    onSuccess: () => {
      setTarget("");
      setNote("");
      qc.invalidateQueries({ queryKey: ["purge-feed"] });
    }
  });
  const authed = !!session.data?.pubkey;
  const canSubmit = authed && target.trim().length >= 32 && !purge.isPending;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "frame-cult p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "mb-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[11px] uppercase tracking-[0.4em] text-glow-bone", children: "PURGE_PROTOCOL // M4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] uppercase tracking-[0.3em] text-muted-foreground", children: [
        "ledger: ",
        feed.data?.total ?? 0
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "block text-[10px] uppercase tracking-[0.35em] text-muted-foreground", children: "target_contract" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          value: target,
          onChange: (e) => setTarget(e.target.value),
          placeholder: "So11111111111111111111111111111111111111112",
          spellCheck: false,
          className: "w-full border border-border/60 bg-background/40 px-3 py-2 font-mono text-[12px] tracking-tight outline-none focus:border-foreground/60"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          value: note,
          onChange: (e) => setNote(e.target.value),
          placeholder: "rite_note (optional, ≤140)",
          maxLength: 140,
          className: "w-full border border-border/60 bg-background/40 px-3 py-2 text-[12px] outline-none focus:border-foreground/60"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: "btn-cult w-full",
          disabled: !canSubmit,
          onClick: () => purge.mutate({ target: target.trim(), note: note.trim() || void 0 }),
          style: { boxShadow: canSubmit ? "var(--shadow-glow-violet)" : void 0 },
          children: !authed ? "AUTH_REQUIRED" : purge.isPending ? "PURGING…" : "▒ EXECUTE_PURGE ▒"
        }
      ),
      purge.isError && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] uppercase tracking-[0.3em] text-destructive", children: [
        "✗ ",
        purge.error.message
      ] }),
      purge.isSuccess && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] uppercase tracking-[0.3em] text-glow-acid", children: [
        "✓ void_confirmed // slot ",
        purge.data.slot ?? "—"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 border-t border-border/60 pt-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 text-[10px] uppercase tracking-[0.35em] text-muted-foreground", children: "recent_purges" }),
      feed.data?.error && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] uppercase tracking-[0.3em] text-destructive", children: [
        "ledger_offline: ",
        feed.data.error
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "space-y-1.5 font-mono text-[11px]", children: [
        (feed.data?.entries ?? []).map((e) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-between gap-3 border-b border-border/30 py-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-glow-acid", children: "∅" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground/80", children: short(e.target, 6, 6) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
            "by ",
            short(e.pubkey)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: new Date(e.ts).toISOString().slice(11, 19) })
        ] }, e.signature)),
        feed.data && feed.data.entries.length === 0 && !feed.data.error && /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "py-2 text-[11px] text-muted-foreground", children: "// ledger empty — be the first to dissolve" })
      ] })
    ] })
  ] });
}
function parseSpans(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (s) => !!s && typeof s.start === "number" && typeof s.end === "number"
  ).filter((s) => s.end > s.start).sort((a, b) => a.start - b.start);
}
function segmentBody(text, spans) {
  const out = [];
  let cursor = 0;
  for (const s of spans) {
    const start = Math.max(s.start, cursor);
    const end = Math.min(s.end, text.length);
    if (end <= start) continue;
    if (start > cursor) out.push({ kind: "text", value: text.slice(cursor, start) });
    out.push({ kind: "redacted", value: text.slice(start, end) });
    cursor = end;
  }
  if (cursor < text.length) out.push({ kind: "text", value: text.slice(cursor) });
  return out;
}
function HoverRedacted({ value }) {
  const [revealed, setRevealed] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "span",
    {
      onMouseEnter: () => setRevealed(true),
      onMouseLeave: () => setRevealed(false),
      onFocus: () => setRevealed(true),
      onBlur: () => setRevealed(false),
      tabIndex: 0,
      role: "button",
      "aria-label": revealed ? "Redacted text revealed" : "Hover to reveal redacted text",
      className: revealed ? "rounded-sm bg-foreground/10 px-1 text-foreground" : "redacted cursor-pointer select-none",
      style: revealed ? void 0 : { backgroundColor: "currentColor", color: "transparent", borderRadius: 2 },
      children: revealed ? value : "█".repeat(Math.max(3, Math.min(20, value.length)))
    }
  );
}
function IntelEntry({ row }) {
  const spans = parseSpans(row.redactedSpans);
  const segs = segmentBody(row.body, spans);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "border-b border-border/40 py-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "mb-1 flex items-baseline justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-glow-acid", children: [
        "▸ ",
        row.classification
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "slot ",
        row.slot ?? "—",
        " // ",
        new Date(row.createdAt).toISOString().slice(11, 19)
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "mb-1 text-[12px] uppercase tracking-[0.2em] text-foreground", children: row.headline }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-mono text-[11px] leading-relaxed text-foreground/80", children: segs.map(
      (s, i) => s.kind === "text" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: s.value }, i) : /* @__PURE__ */ jsxRuntimeExports.jsx(HoverRedacted, { value: s.value }, i)
    ) })
  ] });
}
function IntelHorizon() {
  const session = useQuery({ queryKey: ["auth-session"], queryFn: () => getAuthSession() });
  const authed = !!session.data?.pubkey;
  const [rows, setRows] = reactExports.useState([]);
  const [status, setStatus] = reactExports.useState("idle");
  const [errorMsg, setErrorMsg] = reactExports.useState(null);
  const esRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!authed) return;
    setStatus("connecting");
    const es = new EventSource("/api/intel", { withCredentials: true });
    esRef.current = es;
    es.addEventListener("backfill", (e) => {
      try {
        const data = JSON.parse(e.data);
        setRows(data);
        setStatus("live");
      } catch {
      }
    });
    es.addEventListener("intel", (e) => {
      try {
        const row = JSON.parse(e.data);
        setRows((prev) => [row, ...prev].slice(0, 50));
      } catch {
      }
    });
    es.addEventListener("error", (e) => {
      const msg = e.data;
      if (typeof msg === "string") {
        try {
          setErrorMsg(JSON.parse(msg).message);
        } catch {
          setErrorMsg(msg);
        }
      }
    });
    es.onerror = () => setStatus("error");
    return () => {
      es.close();
      esRef.current = null;
      setStatus("closed");
    };
  }, [authed]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "frame-cult p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "mb-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[11px] uppercase tracking-[0.4em] text-glow-bone", children: "INTEL_STREAM // SSE" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase tracking-[0.3em] text-muted-foreground", children: status === "live" ? "● live" : status === "connecting" ? "◌ connecting" : status === "error" ? "✗ error" : status === "closed" ? "○ closed" : "—" })
    ] }),
    !authed && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-[0.3em] text-muted-foreground", children: "// auth_required — sign in to receive feed" }),
    errorMsg && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-2 text-[10px] uppercase tracking-[0.3em] text-destructive", children: [
      "stream_err: ",
      errorMsg
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "max-h-96 overflow-y-auto", children: [
      rows.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx(IntelEntry, { row: r }, r.id)),
      authed && rows.length === 0 && status === "live" && /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "py-3 text-[11px] text-muted-foreground", children: "// no intel — awaiting transmission" })
    ] })
  ] });
}
function Glyph() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 200 200", className: "h-14 w-14 shrink-0", "aria-hidden": true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("defs", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "saber", x1: "0", y1: "1", x2: "1", y2: "0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "#fff" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "50%", stopColor: "oklch(0.72 0.20 240)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "oklch(0.62 0.27 295)" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("filter", { id: "g", children: /* @__PURE__ */ jsxRuntimeExports.jsx("feGaussianBlur", { stdDeviation: "3" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "100", cy: "100", r: "60", fill: "none", stroke: "#fff", strokeWidth: "6" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "100", cy: "100", r: "60", fill: "none", stroke: "#fff", strokeWidth: "2", filter: "url(#g)", opacity: "0.8" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "92", y: "20", width: "16", height: "160", transform: "rotate(35 100 100)", fill: "url(#saber)", filter: "url(#g)", opacity: "0.95" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "96", y: "20", width: "8", height: "160", transform: "rotate(35 100 100)", fill: "#fff" })
  ] });
}
function Index() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(NullWalletProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-h-screen overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(NullCanvas, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none fixed inset-0 scanlines opacity-50", "aria-hidden": true }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-start justify-between gap-4 border-b border-border/60 px-6 py-5 md:px-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Glyph, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-[13px] font-medium uppercase tracking-[0.5em] text-glow-bone", children: "NULL_FORM" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-[0.4em] text-muted-foreground", children: "0x8000NULL // sys_reset // protocol-Ø" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden md:block", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SiwsGate, {}) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-border/60 px-6 py-4 md:hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SiwsGate, {}) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto max-w-6xl px-6 pt-16 pb-10 md:px-10 md:pt-24", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] uppercase tracking-[0.5em] text-glow-violet", children: [
          "▌ transmission_log // ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(Redacted, { children: "identity_recovered" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "mt-6 text-4xl font-medium leading-[1.05] text-glow-bone md:text-6xl", children: [
          "you are not a person.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "you are a ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-glow-acid", children: "∅" }),
          " waiting to be confirmed."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 max-w-xl text-[13px] leading-relaxed text-muted-foreground", children: "NULL_FORM is the cult of the void. sign the nonce, dissolve the wrapper, watch the chain forget you in real time. there is no roadmap. there is only descent." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[0.35em]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "↳ status:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-glow-acid", children: "SYS_RESET" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "opacity: 0.2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "font_size: 10" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto grid max-w-6xl gap-6 px-6 pb-24 md:grid-cols-2 md:px-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(EventHorizon, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(JupiterSwap, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(PurgeProtocol, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(IntelHorizon, {}) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "border-t border-border/60 px-6 py-6 text-[10px] uppercase tracking-[0.35em] text-muted-foreground md:px-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "∅ null_form / protocol-Ø / no_roadmap" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "SIWS-v1 // jupiter_v6 // edge-runtime" })
      ] }) })
    ] })
  ] }) });
}
export {
  Index as component
};

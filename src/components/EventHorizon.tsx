import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Connection, PublicKey } from "@solana/web3.js";
import { getNullConfig } from "@/lib/null-config.functions";

type Event = { sig: string; slot: number; t: number; err: boolean };

export function EventHorizon() {
  const { data: cfg } = useQuery({ queryKey: ["null-config"], queryFn: () => getNullConfig(), staleTime: Infinity });
  const [events, setEvents] = useState<Event[]>([]);
  const [status, setStatus] = useState<"booting" | "live" | "polling" | "down">("booting");
  const seen = useRef(new Set<string>());

  useEffect(() => {
    if (!cfg?.rpcHttp) return;
    let cancelled = false;
    let subId: number | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const conn = new Connection(cfg.rpcHttp, {
      commitment: "confirmed",
      wsEndpoint: cfg.rpcWs || undefined,
    });

    const push = (sig: string, slot: number, err: boolean) => {
      if (seen.current.has(sig)) return;
      seen.current.add(sig);
      setEvents((prev) => [{ sig, slot, t: Date.now(), err }, ...prev].slice(0, 50));
    };

    const startPolling = () => {
      setStatus("polling");
      if (!cfg.mint) return;
      let lastSig: string | undefined;
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
      pollTimer = setInterval(poll, 6000);
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
          "confirmed",
        );
        setStatus("live");
      } catch {
        startPolling();
      }
    };

    start();

    return () => {
      cancelled = true;
      if (subId !== null) conn.removeOnLogsListener(subId).catch(() => {});
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [cfg?.rpcHttp, cfg?.rpcWs, cfg?.mint]);

  const dot =
    status === "live" ? "bg-[color:var(--null-acid)]" :
    status === "polling" ? "bg-[color:var(--null-azure)]" :
    status === "down" ? "bg-destructive" : "bg-muted-foreground";

  return (
    <section className="frame-cult p-5">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`h-2 w-2 rounded-full ${dot}`} />
          <h2 className="text-[11px] uppercase tracking-[0.4em] text-glow-bone">EVENT_HORIZON // LIVE_RPC</h2>
        </div>
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {status === "live" ? "ws_subscribed" : status === "polling" ? "fallback_poll" : status === "down" ? "channel_lost" : "booting"}
        </span>
      </header>
      <div className="grid grid-cols-[80px_1fr_90px] gap-x-4 border-b border-border pb-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        <span>slot</span><span>signature</span><span className="text-right">state</span>
      </div>
      <ul className="mt-1 max-h-[280px] overflow-hidden">
        {events.length === 0 && (
          <li className="py-6 text-center text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
            …awaiting first transmission
          </li>
        )}
        {events.map((e) => (
          <li
            key={e.sig}
            className="grid grid-cols-[80px_1fr_90px] gap-x-4 border-b border-border/40 py-1.5 text-[11px]"
          >
            <span className="text-muted-foreground">{e.slot}</span>
            <a
              href={`https://solscan.io/tx/${e.sig}`}
              target="_blank"
              rel="noreferrer"
              className="truncate font-mono text-glow-bone hover:text-glow-violet"
            >
              {e.sig}
            </a>
            <span className={`text-right ${e.err ? "text-destructive" : "text-glow-acid"}`}>
              {e.err ? "FAIL" : "OK"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

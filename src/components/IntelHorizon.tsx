import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAuthSession } from "@/lib/auth.functions";

// TerminalIntel as it lands from Postgres via /api/intel SSE.
type IntelRow = {
  id: string;
  slot: number | null;
  headline: string;
  body: string;
  redactedSpans: { start: number; end: number }[] | unknown;
  classification: "PUBLIC" | "RESTRICTED" | "CLASSIFIED" | "REDACTED";
  createdAt: string;
};

function parseSpans(raw: unknown): { start: number; end: number }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (s): s is { start: number; end: number } =>
        !!s && typeof (s as { start: unknown }).start === "number" && typeof (s as { end: unknown }).end === "number",
    )
    .filter((s) => s.end > s.start)
    .sort((a, b) => a.start - b.start);
}

// Split `text` into alternating reveal / redacted segments using sorted, non-overlapping spans.
function segmentBody(text: string, spans: { start: number; end: number }[]) {
  const out: { kind: "text" | "redacted"; value: string }[] = [];
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

function HoverRedacted({ value }: { value: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <span
      onMouseEnter={() => setRevealed(true)}
      onMouseLeave={() => setRevealed(false)}
      onFocus={() => setRevealed(true)}
      onBlur={() => setRevealed(false)}
      tabIndex={0}
      role="button"
      aria-label={revealed ? "Redacted text revealed" : "Hover to reveal redacted text"}
      className={
        revealed
          ? "rounded-sm bg-foreground/10 px-1 text-foreground"
          : "redacted cursor-pointer select-none"
      }
      style={
        revealed
          ? undefined
          : { backgroundColor: "currentColor", color: "transparent", borderRadius: 2 }
      }
    >
      {revealed ? value : "█".repeat(Math.max(3, Math.min(20, value.length)))}
    </span>
  );
}

function IntelEntry({ row }: { row: IntelRow }) {
  const spans = parseSpans(row.redactedSpans);
  const segs = segmentBody(row.body, spans);
  return (
    <li className="border-b border-border/40 py-3">
      <header className="mb-1 flex items-baseline justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        <span className="text-glow-acid">▸ {row.classification}</span>
        <span>
          slot {row.slot ?? "—"} // {new Date(row.createdAt).toISOString().slice(11, 19)}
        </span>
      </header>
      <h4 className="mb-1 text-[12px] uppercase tracking-[0.2em] text-foreground">{row.headline}</h4>
      <p className="font-mono text-[11px] leading-relaxed text-foreground/80">
        {segs.map((s, i) =>
          s.kind === "text" ? (
            <span key={i}>{s.value}</span>
          ) : (
            <HoverRedacted key={i} value={s.value} />
          ),
        )}
      </p>
    </li>
  );
}

export function IntelHorizon() {
  const session = useQuery({ queryKey: ["auth-session"], queryFn: () => getAuthSession() });
  const authed = !!session.data?.pubkey;
  const [rows, setRows] = useState<IntelRow[]>([]);
  const [status, setStatus] = useState<"idle" | "connecting" | "live" | "error" | "closed">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!authed) return;
    setStatus("connecting");
    const es = new EventSource("/api/intel", { withCredentials: true });
    esRef.current = es;

    es.addEventListener("backfill", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as IntelRow[];
        setRows(data);
        setStatus("live");
      } catch {
        /* ignore malformed */
      }
    });
    es.addEventListener("intel", (e) => {
      try {
        const row = JSON.parse((e as MessageEvent).data) as IntelRow;
        setRows((prev) => [row, ...prev].slice(0, 50));
      } catch {
        /* ignore */
      }
    });
    es.addEventListener("error", (e) => {
      const msg = (e as MessageEvent).data;
      if (typeof msg === "string") {
        try {
          setErrorMsg((JSON.parse(msg) as { message: string }).message);
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

  return (
    <article className="frame-cult p-5">
      <header className="mb-3 flex items-center justify-between">
        <h3 className="text-[11px] uppercase tracking-[0.4em] text-glow-bone">INTEL_STREAM // SSE</h3>
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          {status === "live" ? "● live" : status === "connecting" ? "◌ connecting" : status === "error" ? "✗ error" : status === "closed" ? "○ closed" : "—"}
        </span>
      </header>
      {!authed && (
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          // auth_required — sign in to receive feed
        </p>
      )}
      {errorMsg && (
        <p className="mb-2 text-[10px] uppercase tracking-[0.3em] text-destructive">
          stream_err: {errorMsg}
        </p>
      )}
      <ul className="max-h-96 overflow-y-auto">
        {rows.map((r) => (
          <IntelEntry key={r.id} row={r} />
        ))}
        {authed && rows.length === 0 && status === "live" && (
          <li className="py-3 text-[11px] text-muted-foreground">// no intel — awaiting transmission</li>
        )}
      </ul>
    </article>
  );
}

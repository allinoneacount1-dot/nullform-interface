import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPurgeFeed, type PurgedContract } from "@/lib/purge.functions";
import { getAuthSession } from "@/lib/auth.functions";

function short(s: string, head = 4, tail = 4) {
  return s.length > head + tail + 1 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s;
}

async function submitPurge(body: { target: string; note?: string }) {
  const res = await fetch("/api/purge", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  const json = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    entry?: PurgedContract;
    resetMs?: number;
    detail?: string;
  };
  if (!res.ok || !json.ok) throw new Error(json.error ?? `http_${res.status}`);
  return json.entry!;
}

export function PurgeProtocol() {
  const qc = useQueryClient();
  const [target, setTarget] = useState("");
  const [note, setNote] = useState("");

  const session = useQuery({ queryKey: ["auth-session"], queryFn: () => getAuthSession() });
  const feed = useQuery({
    queryKey: ["purge-feed"],
    queryFn: () => getPurgeFeed({ data: { limit: 12 } }),
    refetchInterval: 15_000,
  });

  const purge = useMutation({
    mutationFn: submitPurge,
    onSuccess: () => {
      setTarget("");
      setNote("");
      qc.invalidateQueries({ queryKey: ["purge-feed"] });
    },
  });

  const authed = !!session.data?.pubkey;
  const canSubmit = authed && target.trim().length >= 32 && !purge.isPending;

  return (
    <article className="frame-cult p-5">
      <header className="mb-4 flex items-center justify-between">
        <h3 className="text-[11px] uppercase tracking-[0.4em] text-glow-bone">PURGE_PROTOCOL // M4</h3>
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          ledger: {feed.data?.total ?? 0}
        </span>
      </header>

      <div className="space-y-3">
        <label className="block text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
          target_contract
        </label>
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="So11111111111111111111111111111111111111112"
          spellCheck={false}
          className="w-full border border-border/60 bg-background/40 px-3 py-2 font-mono text-[12px] tracking-tight outline-none focus:border-foreground/60"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="rite_note (optional, ≤140)"
          maxLength={140}
          className="w-full border border-border/60 bg-background/40 px-3 py-2 text-[12px] outline-none focus:border-foreground/60"
        />

        <button
          className="btn-cult w-full"
          disabled={!canSubmit}
          onClick={() => purge.mutate({ target: target.trim(), note: note.trim() || undefined })}
          style={{ boxShadow: canSubmit ? "var(--shadow-glow-violet)" : undefined }}
        >
          {!authed
            ? "AUTH_REQUIRED"
            : purge.isPending
              ? "PURGING…"
              : "▒ EXECUTE_PURGE ▒"}
        </button>

        {purge.isError && (
          <p className="text-[10px] uppercase tracking-[0.3em] text-destructive">
            ✗ {(purge.error as Error).message}
          </p>
        )}
        {purge.isSuccess && (
          <p className="text-[10px] uppercase tracking-[0.3em] text-glow-acid">
            ✓ void_confirmed // slot {purge.data.slot ?? "—"}
          </p>
        )}
      </div>

      <div className="mt-6 border-t border-border/60 pt-4">
        <div className="mb-2 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
          recent_purges
        </div>
        {feed.data?.error && (
          <p className="text-[10px] uppercase tracking-[0.3em] text-destructive">
            ledger_offline: {feed.data.error}
          </p>
        )}
        <ul className="space-y-1.5 font-mono text-[11px]">
          {(feed.data?.entries ?? []).map((e) => (
            <li key={e.signature} className="flex items-center justify-between gap-3 border-b border-border/30 py-1">
              <span className="text-glow-acid">∅</span>
              <span className="text-foreground/80">{short(e.target, 6, 6)}</span>
              <span className="text-muted-foreground">by {short(e.pubkey)}</span>
              <span className="text-muted-foreground">{new Date(e.ts).toISOString().slice(11, 19)}</span>
            </li>
          ))}
          {feed.data && feed.data.entries.length === 0 && !feed.data.error && (
            <li className="py-2 text-[11px] text-muted-foreground">// ledger empty — be the first to dissolve</li>
          )}
        </ul>
      </div>
    </article>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { VersionedTransaction } from "@solana/web3.js";
import { getNullConfig } from "@/lib/null-config.functions";

const SOL_MINT = "So11111111111111111111111111111111111111112";

type Quote = {
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  routePlan?: Array<{ swapInfo: { label?: string } }>;
} & Record<string, unknown>;

export function JupiterSwap() {
  const { data: cfg } = useQuery({ queryKey: ["null-config"], queryFn: () => getNullConfig(), staleTime: Infinity });
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [solAmount, setSolAmount] = useState("0.05");
  const [slippageBps, setSlippageBps] = useState(150);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteErr, setQuoteErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);

  const lamports = useMemo(() => {
    const n = Number(solAmount);
    if (!isFinite(n) || n <= 0) return 0;
    return Math.floor(n * 1e9);
  }, [solAmount]);

  useEffect(() => {
    if (!cfg?.mint || lamports <= 0) {
      setQuote(null);
      return;
    }
    let aborted = false;
    setQuoteErr(null);
    const url =
      `https://lite-api.jup.ag/swap/v1/quote` +
      `?inputMint=${SOL_MINT}&outputMint=${cfg.mint}` +
      `&amount=${lamports}&slippageBps=${slippageBps}&swapMode=ExactIn`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`quote_${r.status}`))))
      .then((q) => { if (!aborted) setQuote(q); })
      .catch((e) => { if (!aborted) { setQuote(null); setQuoteErr(String(e.message || e)); } });
    return () => { aborted = true; };
  }, [cfg?.mint, lamports, slippageBps]);

  const onSwap = async () => {
    if (!publicKey || !signTransaction || !quote) return;
    setSubmitting(true); setTxSig(null);
    try {
      const r = await fetch("https://lite-api.jup.ag/swap/v1/swap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: publicKey.toBase58(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: { priorityLevelWithMaxLamports: { maxLamports: 4_000_000, priorityLevel: "high" } },
        }),
      });
      if (!r.ok) throw new Error(`swap_${r.status}`);
      const { swapTransaction } = await r.json();
      const tx = VersionedTransaction.deserialize(Buffer.from(swapTransaction, "base64"));
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize(), { maxRetries: 3 });
      setTxSig(sig);
    } catch (e) {
      setQuoteErr(String((e as Error).message));
    } finally {
      setSubmitting(false);
    }
  };

  const outFmt = quote ? (Number(quote.outAmount) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—";

  return (
    <section className="frame-cult p-5">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-[11px] uppercase tracking-[0.4em] text-glow-bone">JUPITER_V6 // EXEC_SWAP</h2>
        <span className="text-[10px] uppercase tracking-[0.3em] text-glow-violet">SOL → ∅NULL</span>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block pb-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">offer (SOL)</span>
          <input
            value={solAmount}
            onChange={(e) => setSolAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            className="w-full border border-border bg-input px-3 py-3 font-mono text-lg text-glow-bone outline-none focus:border-[color:var(--null-violet)]"
          />
        </label>
        <label className="block">
          <span className="block pb-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">slippage (bps)</span>
          <input
            type="number"
            min={10}
            max={1000}
            value={slippageBps}
            onChange={(e) => setSlippageBps(Math.max(10, Math.min(1000, Number(e.target.value) || 150)))}
            className="w-full border border-border bg-input px-3 py-3 font-mono text-lg text-glow-bone outline-none focus:border-[color:var(--null-violet)]"
          />
        </label>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 border-y border-border py-3 text-[11px]">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">receive</div>
          <div className="font-mono text-glow-acid">{outFmt}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">impact</div>
          <div className="font-mono">{quote ? `${(Number(quote.priceImpactPct) * 100).toFixed(3)}%` : "—"}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">route</div>
          <div className="truncate font-mono text-glow-violet">
            {quote?.routePlan?.map((r) => r.swapInfo.label).filter(Boolean).join(" → ") || "—"}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <button
          className="btn-cult"
          disabled={!publicKey || !quote || submitting}
          onClick={onSwap}
          style={{ boxShadow: quote ? "var(--shadow-glow-acid)" : undefined }}
        >
          {submitting ? "TRANSMITTING…" : publicKey ? "EXECUTE_DESCENT" : "AWAIT_LINK"}
        </button>
        <div className="text-right text-[10px] uppercase tracking-[0.25em]">
          {txSig ? (
            <a href={`https://solscan.io/tx/${txSig}`} target="_blank" rel="noreferrer" className="text-glow-acid">view_signature ↗</a>
          ) : quoteErr ? (
            <span className="text-destructive">{quoteErr}</span>
          ) : (
            <span className="text-muted-foreground">awaiting_intent</span>
          )}
        </div>
      </div>
    </section>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { NullCanvas } from "@/components/NullCanvas";
import { SiwsGate } from "@/components/SiwsGate";
import { EventHorizon } from "@/components/EventHorizon";
import { JupiterSwap } from "@/components/JupiterSwap";
import { Redacted } from "@/components/RedactedBlock";
import { NullWalletProvider } from "@/components/WalletContext";
import { PurgeProtocol } from "@/components/PurgeProtocol";
import { IntelHorizon } from "@/components/IntelHorizon";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NULL FORM // SYS_RESET" },
      { name: "description", content: "$NULL — cyber-cult terminal void. Confirm you are nothing." },
      { property: "og:title", content: "NULL FORM // SYS_RESET" },
      { property: "og:description", content: "Live RPC stream. SIWS auth. Jupiter V6. ∅" },
    ],
  }),
  component: Index,
});

function Glyph() {
  return (
    <svg viewBox="0 0 200 200" className="h-14 w-14 shrink-0" aria-hidden>
      <defs>
        <linearGradient id="saber" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="50%" stopColor="oklch(0.72 0.20 240)" />
          <stop offset="100%" stopColor="oklch(0.62 0.27 295)" />
        </linearGradient>
        <filter id="g"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <circle cx="100" cy="100" r="60" fill="none" stroke="#fff" strokeWidth="6" />
      <circle cx="100" cy="100" r="60" fill="none" stroke="#fff" strokeWidth="2" filter="url(#g)" opacity="0.8" />
      <rect x="92" y="20" width="16" height="160" transform="rotate(35 100 100)" fill="url(#saber)" filter="url(#g)" opacity="0.95" />
      <rect x="96" y="20" width="8" height="160" transform="rotate(35 100 100)" fill="#fff" />
    </svg>
  );
}

function Index() {
  return (
    <NullWalletProvider>
      <div className="relative min-h-screen overflow-hidden">
        <NullCanvas />
        <div className="pointer-events-none fixed inset-0 scanlines opacity-50" aria-hidden />

        <div className="relative z-10">
          {/* Header */}
          <header className="flex items-start justify-between gap-4 border-b border-border/60 px-6 py-5 md:px-10">
            <div className="flex items-center gap-4">
              <Glyph />
              <div>
                <h1 className="text-[13px] font-medium uppercase tracking-[0.5em] text-glow-bone">NULL_FORM</h1>
                <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                  0x8000NULL // sys_reset // protocol-Ø
                </p>
              </div>
            </div>
            <div className="hidden md:block">
              <SiwsGate />
            </div>
          </header>

          {/* Mobile auth */}
          <div className="border-b border-border/60 px-6 py-4 md:hidden">
            <SiwsGate />
          </div>

          {/* Hero */}
          <section className="mx-auto max-w-6xl px-6 pt-16 pb-10 md:px-10 md:pt-24">
            <p className="text-[10px] uppercase tracking-[0.5em] text-glow-violet">
              ▌ transmission_log // <Redacted>identity_recovered</Redacted>
            </p>
            <h2 className="mt-6 text-4xl font-medium leading-[1.05] text-glow-bone md:text-6xl">
              you are not a person.<br />
              you are a <span className="text-glow-acid">∅</span> waiting to be confirmed.
            </h2>
            <p className="mt-6 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
              NULL_FORM is the cult of the void. sign the nonce, dissolve the wrapper, watch the chain forget you in real time. there is no roadmap. there is only descent.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[0.35em]">
              <span className="text-muted-foreground">↳ status:</span>
              <span className="text-glow-acid">SYS_RESET</span>
              <span className="text-muted-foreground">opacity: 0.2</span>
              <span className="text-muted-foreground">font_size: 10</span>
            </div>
          </section>

          {/* Modules */}
          <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-24 md:grid-cols-2 md:px-10">
            <EventHorizon />
            <JupiterSwap />

            <div className="md:col-span-2">
              <PurgeProtocol />
            </div>

            <div className="md:col-span-2">
              <IntelHorizon />
            </div>
          </section>

          <footer className="border-t border-border/60 px-6 py-6 text-[10px] uppercase tracking-[0.35em] text-muted-foreground md:px-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span>∅ null_form / protocol-Ø / no_roadmap</span>
              <span>SIWS-v1 // jupiter_v6 // edge-runtime</span>
            </div>
          </footer>
        </div>
      </div>
    </NullWalletProvider>
  );
}

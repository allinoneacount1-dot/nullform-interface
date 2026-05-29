import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import bs58 from "bs58";
import { getAuthNonce, verifyAuthSignature, getAuthSession, logoutAuth } from "@/lib/auth.functions";

function short(pk: string) {
  return `${pk.slice(0, 4)}…${pk.slice(-4)}`;
}

export function SiwsGate() {
  const { wallets, select, connect, disconnect, connected, publicKey, signMessage, wallet } = useWallet();
  const [picker, setPicker] = useState(false);
  const qc = useQueryClient();

  const session = useQuery({
    queryKey: ["auth-session"],
    queryFn: () => getAuthSession(),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (wallet && !connected) connect().catch(() => {});
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auth-session"] }),
  });

  const onLogout = useCallback(async () => {
    await logoutAuth();
    await disconnect().catch(() => {});
    qc.invalidateQueries({ queryKey: ["auth-session"] });
  }, [disconnect, qc]);

  const authed = !!session.data?.pubkey;

  if (authed) {
    return (
      <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.25em]">
        <span className="text-glow-acid">◉ AUTH_OK</span>
        <span className="text-muted-foreground">{short(session.data!.pubkey!)}</span>
        <button className="btn-cult" onClick={onLogout}>SEVER_LINK</button>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="relative">
        <button className="btn-cult" onClick={() => setPicker((v) => !v)}>
          ⏚ INITIATE_LINK
        </button>
        {picker && (
          <div className="absolute right-0 z-30 mt-2 w-64 frame-cult p-2">
            <div className="px-2 pb-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">select_vessel</div>
            {wallets.length === 0 && (
              <div className="px-2 py-3 text-[11px] text-muted-foreground">no wallets detected</div>
            )}
            {wallets.map((w) => (
              <button
                key={w.adapter.name}
                onClick={async () => {
                  select(w.adapter.name);
                  setPicker(false);
                }}
                className="flex w-full items-center justify-between px-2 py-2 text-left text-[12px] uppercase tracking-[0.2em] hover:bg-secondary"
              >
                <span>{w.adapter.name}</span>
                <span className="text-[10px] text-muted-foreground">{w.readyState}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
        {publicKey ? short(publicKey.toBase58()) : "—"}
      </span>
      <button
        className="btn-cult"
        onClick={() => sign.mutate()}
        disabled={sign.isPending}
        style={{ boxShadow: "var(--shadow-glow-violet)" }}
      >
        {sign.isPending ? "AWAIT_SIG…" : "CONFIRM YOU ARE NOTHING"}
      </button>
      {sign.isError && (
        <span className="text-[10px] uppercase tracking-[0.2em] text-destructive">REJECTED</span>
      )}
    </div>
  );
}

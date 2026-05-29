import { useMemo, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";
import { useQuery } from "@tanstack/react-query";
import { getNullConfig } from "@/lib/null-config.functions";

export function NullWalletProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery({
    queryKey: ["null-config"],
    queryFn: () => getNullConfig(),
    staleTime: Infinity,
  });

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new BackpackWalletAdapter()],
    [],
  );

  const endpoint = data?.rpcHttp ?? "https://api.mainnet-beta.solana.com";

  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment: "confirmed", wsEndpoint: data?.rpcWs }}>
      <WalletProvider wallets={wallets} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}

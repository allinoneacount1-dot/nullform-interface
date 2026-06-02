import { createServerFn } from "./react-start-stub";

// Returns runtime-public config to the client. These values end up in the
// browser (WebSocket RPC subscription happens client-side); use a CORS-
// restricted RPC endpoint or a public-read API key.
export const getNullConfig = createServerFn({ method: "GET" }).handler(async () => {
  return {
    mint: process.env.NULL_MINT_ADDRESS ?? "",
    rpcHttp: process.env.SOLANA_RPC_HTTP_URL ?? "https://api.mainnet-beta.solana.com",
    rpcWs: process.env.SOLANA_RPC_WS_URL ?? "wss://api.mainnet-beta.solana.com",
  };
});

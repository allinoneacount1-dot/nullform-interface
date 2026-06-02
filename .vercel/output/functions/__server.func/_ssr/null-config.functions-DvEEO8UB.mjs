import { c as createServerRpc } from "./createServerRpc-DUq7MKf3.mjs";
import { a as createServerFn } from "./server-cZkq-rCv.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
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
const getNullConfig_createServerFn_handler = createServerRpc({
  id: "458ca223179642a618852e7e6a915ebc4c5aa34505b0ff6783fd7fe509e0c46e",
  name: "getNullConfig",
  filename: "src/lib/null-config.functions.ts"
}, (opts) => getNullConfig.__executeServer(opts));
const getNullConfig = createServerFn({
  method: "GET"
}).handler(getNullConfig_createServerFn_handler, async () => {
  return {
    mint: process.env.NULL_MINT_ADDRESS ?? "",
    rpcHttp: process.env.SOLANA_RPC_HTTP_URL ?? "https://api.mainnet-beta.solana.com",
    rpcWs: process.env.SOLANA_RPC_WS_URL ?? "wss://api.mainnet-beta.solana.com"
  };
});
export {
  getNullConfig_createServerFn_handler
};

import { c as createServerRpc } from "./createServerRpc-DUq7MKf3.mjs";
import { a as createServerFn } from "./server-cZkq-rCv.mjs";
import { r as redis } from "./upstash.server-ku1_woMB.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as objectType, n as numberType } from "../_libs/zod.mjs";
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
const LEDGER_KEY = "null:purge:ledger";
const getPurgeFeed_createServerFn_handler = createServerRpc({
  id: "0ac11fbf6bd3b8662d49e4bd2e6785181eaad15f270999afe690476db770dc59",
  name: "getPurgeFeed",
  filename: "src/lib/purge.functions.ts"
}, (opts) => getPurgeFeed.__executeServer(opts));
const getPurgeFeed = createServerFn({
  method: "GET"
}).inputValidator(objectType({
  limit: numberType().min(1).max(50).optional()
})).handler(getPurgeFeed_createServerFn_handler, async ({
  data
}) => {
  try {
    const limit = data.limit ?? 20;
    const [rows, total] = await Promise.all([redis.zrevrange(LEDGER_KEY, 0, limit - 1), redis.zcard(LEDGER_KEY)]);
    const entries = (rows ?? []).map((r) => {
      try {
        return JSON.parse(r);
      } catch {
        return null;
      }
    }).filter((x) => !!x);
    return {
      entries,
      total: total ?? 0,
      error: null
    };
  } catch (e) {
    return {
      entries: [],
      total: 0,
      error: e.message
    };
  }
});
export {
  getPurgeFeed_createServerFn_handler
};

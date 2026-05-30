// Upstash Redis REST client. Worker-safe (pure fetch, no Node net).
// Docs: https://upstash.com/docs/redis/features/restapi

function cfg() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("upstash_not_configured");
  return { url: url.replace(/\/$/, ""), token };
}

async function call<T = unknown>(command: (string | number)[]): Promise<T> {
  const { url, token } = cfg();
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`upstash_${res.status}`);
  const json = (await res.json()) as { result?: T; error?: string };
  if (json.error) throw new Error(`upstash:${json.error}`);
  return json.result as T;
}

export const redis = {
  // Fixed-window rate limit. Returns { allowed, remaining, resetMs }.
  async rateLimit(key: string, limit: number, windowSec: number) {
    const count = await call<number>(["INCR", key]);
    if (count === 1) await call(["EXPIRE", key, windowSec]);
    const ttl = await call<number>(["TTL", key]);
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetMs: (ttl > 0 ? ttl : windowSec) * 1000,
    };
  },
  async zadd(key: string, score: number, member: string) {
    return call<number>(["ZADD", key, score, member]);
  },
  async zrevrange(key: string, start: number, stop: number) {
    return call<string[]>(["ZREVRANGE", key, start, stop]);
  },
  async zcard(key: string) {
    return call<number>(["ZCARD", key]);
  },
  async sismember(key: string, member: string) {
    return call<number>(["SISMEMBER", key, member]);
  },
  async sadd(key: string, member: string) {
    return call<number>(["SADD", key, member]);
  },
};

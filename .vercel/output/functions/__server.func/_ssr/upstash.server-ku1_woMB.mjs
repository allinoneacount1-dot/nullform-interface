function cfg() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("upstash_not_configured");
  return { url: url.replace(/\/$/, ""), token };
}
async function call(command) {
  const { url, token } = cfg();
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command)
  });
  if (!res.ok) throw new Error(`upstash_${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`upstash:${json.error}`);
  return json.result;
}
const redis = {
  // Fixed-window rate limit. Returns { allowed, remaining, resetMs }.
  async rateLimit(key, limit, windowSec) {
    const count = await call(["INCR", key]);
    if (count === 1) await call(["EXPIRE", key, windowSec]);
    const ttl = await call(["TTL", key]);
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetMs: (ttl > 0 ? ttl : windowSec) * 1e3
    };
  },
  async zadd(key, score, member) {
    return call(["ZADD", key, score, member]);
  },
  async zrevrange(key, start, stop) {
    return call(["ZREVRANGE", key, start, stop]);
  },
  async zcard(key) {
    return call(["ZCARD", key]);
  },
  async sismember(key, member) {
    return call(["SISMEMBER", key, member]);
  },
  async sadd(key, member) {
    return call(["SADD", key, member]);
  }
};
export {
  redis as r
};

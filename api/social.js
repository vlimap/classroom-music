import { createHmac } from "node:crypto";
import { PODCAST_EPISODES, getPodcast } from "../src/podcasts.js";

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};
const visitorPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const knownActions = new Set(["like", "unlike", "listen"]);
const RATE_SCRIPT = `
local hits = redis.call("INCR", KEYS[1])
if hits == 1 then redis.call("EXPIRE", KEYS[1], 60) end
return hits
`;
const REACTION_SCRIPT = `
if ARGV[1] == "like" then
  redis.call("SADD", KEYS[1], ARGV[2])
elseif ARGV[1] == "unlike" then
  redis.call("SREM", KEYS[1], ARGV[2])
elseif ARGV[1] == "listen" then
  redis.call("SADD", KEYS[1], ARGV[2])
end
return redis.call("SCARD", KEYS[1])
`;

function send(value, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: jsonHeaders });
}
// A integração Upstash do Vercel Marketplace pode injetar as credenciais
// com nomes KV_REST_API_*. Mantemos os nomes UPSTASH_* para uso externo/local.
function redisCredentials() {
  return {
    url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
  };
}
function isConfigured() {
  const {url, token} = redisCredentials();
  return Boolean(url && token && process.env.SOCIAL_ID_SECRET?.length >= 32);
}
function hash(value) {
  return createHmac("sha256", process.env.SOCIAL_ID_SECRET).update(value).digest("hex");
}
async function redis(commands, pipeline = false) {
  const credentials = redisCredentials();
  const base = credentials.url.replace(/\/$/, "");
  const response = await fetch(base + (pipeline ? "/pipeline" : ""), {
    method: "POST",
    headers: {
      authorization: "Bearer " + credentials.token,
      "content-type": "application/json"
    },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) throw new Error("Redis status " + response.status);
  const answer = await response.json();
  const results = pipeline ? answer : [answer];
  if (!Array.isArray(results) || results.some(result => result?.error))
    throw new Error("Redis returned an invalid result");
  return results.map(result => result.result);
}
async function getTotals() {
  const commands = PODCAST_EPISODES.flatMap(({id}) => [
    ["SCARD", "foco:social:likes:" + id],
    ["SCARD", "foco:social:listeners:" + id]
  ]);
  const values = await redis(commands, true);
  if (values.length !== commands.length) throw new Error("Incomplete Redis pipeline");
  const stats = {};
  PODCAST_EPISODES.forEach(({id}, index) => {
    stats[id] = {
      likes: Number(values[2 * index]),
      listeners: Number(values[2 * index + 1])
    };
  });
  return stats;
}
async function updateTotal({id, action, visitorId}, request) {
  const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const minute = Math.floor(Date.now() / 60000);
  const [rate] = await redis(["EVAL", RATE_SCRIPT, "1",
    "foco:social:limit:" + hash(ip) + ":" + minute]);
  if (Number(rate) > 60) return send({error: "Limite de solicitações excedido."}, 429);

  const kind = action === "listen" ? "listeners" : "likes";
  const key = "foco:social:" + kind + ":" + id;
  const [count] = await redis(["EVAL", REACTION_SCRIPT, "1", key, action, hash(visitorId)]);
  return send({ id, kind, count: Number(count), liked: action === "like" });
}

export default {
  async fetch(request) {
    if (request.method !== "GET" && request.method !== "POST")
      return new Response(null, {status: 405, headers: {allow: "GET, POST"}});
    if (!isConfigured()) return send({error: "Métricas não configuradas."}, 503);
    try {
      if (request.method === "GET") return send({stats: await getTotals()});
      const origin = request.headers.get("origin");
      if (origin && origin !== new URL(request.url).origin)
        return send({error: "Origem não autorizada."}, 403);
      if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
        return send({error: "Content-Type deve ser application/json."}, 415);
      if (Number(request.headers.get("content-length") || 0) > 256)
        return send({error: "Requisição muito grande."}, 413);
      const raw = await request.text();
      if (raw.length > 256) return send({error: "Requisição muito grande."}, 413);
      let payload;
      try { payload = JSON.parse(raw); }
      catch { return send({error: "JSON inválido."}, 400); }
      if (!payload || typeof payload !== "object" ||
          !getPodcast(payload.id) || !knownActions.has(payload.action) ||
          typeof payload.visitorId !== "string" || !visitorPattern.test(payload.visitorId))
        return send({error: "Episódio, ação ou identificador inválido."}, 400);
      return await updateTotal(payload, request);
    } catch (error) {
      console.error("Falha ao consultar métricas dos podcasts:", error.message);
      return send({error: "Serviço de métricas temporariamente indisponível."}, 503);
    }
  }
};

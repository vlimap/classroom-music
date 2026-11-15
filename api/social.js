import { createHmac } from "node:crypto";
import { PODCAST_EPISODES, getPodcast } from "../src/podcasts.js";

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer"
};
const visitorPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const knownActions = new Set(["like", "unlike", "listen"]);
// A limitação é atômica, por IP da borda Vercel, e inclui consultas (GET).
// Limites separados por minuto e por dia protegem também a quota gratuita.
const RATE_SCRIPT = `
local minute = redis.call("INCR", KEYS[1])
if minute == 1 then redis.call("EXPIRE", KEYS[1], 60) end
local day = redis.call("INCR", KEYS[2])
if day == 1 then redis.call("EXPIRE", KEYS[2], 86400) end
return {minute, day}
`;
const RATE_LIMITS = Object.freeze({
  get: Object.freeze({ minute: 30, day: 1000 }),
  post: Object.freeze({ minute: 60, day: 1000 })
});
const BODY_LIMIT = 256;
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
    const likes = Number(values[2 * index]);
    const listeners = Number(values[2 * index + 1]);
    if (![likes, listeners].every(value => Number.isSafeInteger(value) && value >= 0))
      throw new Error("Invalid Redis counter");
    stats[id] = { likes, listeners };
  });
  return stats;
}
function clientIp(request) {
  // A Vercel sobrescreve x-forwarded-for para evitar spoofing. Em produção,
  // priorizamos o header da própria borda (https://vercel.com/docs/headers/request-headers).
  const supplied = request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for") || "unknown";
  return supplied.split(",")[0].trim().slice(0, 64);
}

async function checkRateLimit(request, operation) {
  const now = Date.now();
  const limits = RATE_LIMITS[operation];
  const identity = hash(clientIp(request));
  const prefix = "foco:social:rate:" + operation + ":" + identity + ":";
  const [values] = await redis([
    "EVAL", RATE_SCRIPT, "2",
    prefix + "minute:" + Math.floor(now / 60000),
    prefix + "day:" + Math.floor(now / 86400000)
  ]);
  if (!Array.isArray(values) || values.length !== 2 ||
      !values.every(item => Number.isSafeInteger(Number(item))))
    throw new Error("Invalid rate-limit response");
  return Number(values[0]) <= limits.minute && Number(values[1]) <= limits.day;
}

async function readLimitedBody(request) {
  if (!request.body) return { text: "" };
  const reader = request.body.getReader();
  const chunks = [];
  let received = 0;
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > BODY_LIMIT) {
      await reader.cancel();
      return {tooLarge: true};
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try { return {text: new TextDecoder("utf-8", {fatal: true}).decode(bytes)}; }
  catch { return {badEncoding: true}; }
}

async function updateTotal({id, action, visitorId}) {
  const kind = action === "listen" ? "listeners" : "likes";
  const key = "foco:social:" + kind + ":" + id;
  const [count] = await redis(["EVAL", REACTION_SCRIPT, "1",
    key, action, hash(visitorId.toLowerCase())]);
  const total = Number(count);
  if (!Number.isSafeInteger(total) || total < 0)
    throw new Error("Invalid reaction count");
  return send({ id, kind, count: total, liked: action === "like" });
}

export default {
  async fetch(request) {
    if (request.method !== "GET" && request.method !== "POST")
      return new Response(null, {status: 405, headers: {...jsonHeaders, allow: "GET, POST"}});
    if (!isConfigured()) return send({error: "Métricas não configuradas."}, 503);
    try {
      if (request.method === "GET") {
        if (!await checkRateLimit(request, "get"))
          return send({error: "Muitas consultas. Tente novamente mais tarde."}, 429);
        return send({stats: await getTotals()});
      }
      // Mutações são exclusivamente same-origin; sem Origin também é negado.
      // A ausência de cookies evita dependência de login/sessão.
      const origin = request.headers.get("origin");
      if (!origin || origin !== new URL(request.url).origin ||
          !["same-origin", null].includes(request.headers.get("sec-fetch-site")))
        return send({error: "Origem não autorizada."}, 403);
      if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(
        request.headers.get("content-type") || ""))
        return send({error: "Content-Type deve ser application/json."}, 415);
      const statedLength = request.headers.get("content-length");
      if (statedLength !== null &&
          (!/^\d+$/.test(statedLength) || Number(statedLength) > BODY_LIMIT))
        return send({error: "Requisição muito grande."}, 413);
      const body = await readLimitedBody(request);
      if (body.tooLarge) return send({error: "Requisição muito grande."}, 413);
      if (body.badEncoding) return send({error: "Codificação inválida."}, 400);
      let payload;
      try { payload = JSON.parse(body.text); }
      catch { return send({error: "JSON inválido."}, 400); }
      if (!payload || Array.isArray(payload) || typeof payload !== "object" ||
          Object.keys(payload).length !== 3 ||
          !getPodcast(payload.id) || !knownActions.has(payload.action) ||
          typeof payload.visitorId !== "string" || !visitorPattern.test(payload.visitorId))
        return send({error: "Episódio, ação ou identificador inválido."}, 400);
      if (!await checkRateLimit(request, "post"))
        return send({error: "Limite de solicitações excedido."}, 429);
      return await updateTotal(payload);
    } catch (error) {
      // Sem tokens, UUIDs ou IPs nos logs.
      console.error("Serviço de métricas indisponível:", error?.name || "Error");
      return send({error: "Serviço de métricas temporariamente indisponível."}, 503);
    }
  }
};

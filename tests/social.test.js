import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import handler from "../api/social.js";

const load = path => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
const visitorId = "123e4567-e89b-42d3-a456-426614174000";
const oldEnv = {
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
  secret: process.env.SOCIAL_ID_SECRET,
  kvUrl: process.env.KV_REST_API_URL,
  kvToken: process.env.KV_REST_API_TOKEN
};
const oldFetch = globalThis.fetch;
function configure(){
  process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  process.env.SOCIAL_ID_SECRET = "a".repeat(32);
}
function restore(){
  for(const [key,value] of Object.entries({
    UPSTASH_REDIS_REST_URL: oldEnv.url,
    UPSTASH_REDIS_REST_TOKEN: oldEnv.token,
    SOCIAL_ID_SECRET: oldEnv.secret,
    KV_REST_API_URL: oldEnv.kvUrl,
    KV_REST_API_TOKEN: oldEnv.kvToken
  })){
    if(value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  globalThis.fetch = oldFetch;
}
function req(method = "GET", body, headers = {}){
  return new Request("https://foco.dev/api/social", {
    method, headers: {
      ...(method === "POST" ? {origin: "https://foco.dev"} : {}),
      ...(body ? {"content-type":"application/json"} : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  });
}

test("cards têm coração, métricas e destinos de clique independentes",()=>{
  const ui = load("../src/podcast-ui.js");
  const css = load("../src/styles/app.css");
  assert.match(ui,/createElement\("article"\)/);
  assert.match(ui,/className = "podcast-card-open"/);
  assert.match(ui,/className = "podcast-like"/);
  assert.match(ui,/aria-pressed/);
  assert.match(ui,/className = "podcast-listeners"/);
  assert.match(css,/max-width:min\(100%,340px\)/);
  assert.match(css,/color:var\(--color-accent\)/);
});
test("contabilização ocorre após reprodução real e nunca pelo clique no card",()=>{
  const main = load("../src/main.js");
  assert.match(main,/fileAudio\.addEventListener\("timeupdate",trackListeningTime\)/);
  assert.match(main,/listening\.seconds>=30/);
  assert.match(main,/delta>0 && delta<=2\.5/);
});
test("API não retorna contagens inventadas sem Redis configurado",async()=>{
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.SOCIAL_ID_SECRET;
  try{
    const res = await handler.fetch(req());
    assert.equal(res.status,503);
    assert.match((await res.json()).error,/não configuradas/);
  }finally{ restore(); }
});
test("GET consulta os totais reais de cada episódio em pipeline",async()=>{
  configure();
  globalThis.fetch = async (url, options) => {
    assert.equal(options.method,"POST");
    if (url === "https://example.upstash.io") {
      const [name,script,keys] = JSON.parse(options.body);
      assert.equal(name,"EVAL");
      assert.equal(keys,"2");
      assert.match(script,/EXPIRE/);
      return Response.json({result:[1,1]});
    }
    assert.equal(url, "https://example.upstash.io/pipeline");
    const commands=JSON.parse(options.body);
    assert.equal(commands.length,14);
    assert.ok(commands.every(([name])=>name==="SCARD"));
    return Response.json(commands.map((_,index)=>({result:index+1})));
  };
  try{
    const res = await handler.fetch(req());
    assert.equal(res.status,200);
    assert.equal(res.headers.get("cache-control"),"no-store");
    const {stats} = await res.json();
    assert.deepEqual(stats["javascript-em-10-dias"],{likes:1,listeners:2});
    assert.deepEqual(stats["bug-do-milenio"],{likes:13,listeners:14});
  }finally{restore();}
});
test("POST valida entrada e rejeita origem não autorizada",async()=>{
  configure();
  try{
    const invalid=await handler.fetch(req("POST",{id:"invalid",action:"like",visitorId}));
    assert.equal(invalid.status,400);
    const foreign=await handler.fetch(req("POST",{id:"javascript-em-10-dias",action:"like",visitorId},{origin:"https://evil.example"}));
    assert.equal(foreign.status,403);
  }finally{restore();}
});
test("POST registra like de forma atômica e devolve contagem persistida",async()=>{
  configure();
  let calls=0;
  globalThis.fetch = async (_url, options) => {
    const [name,script,numKeys,key,action,identifier]=JSON.parse(options.body);
    assert.equal(name,"EVAL");
    calls++;
    if(calls===1){
      assert.equal(numKeys,"2");
      assert.match(key,/foco:social:rate:post:/);
      return Response.json({result:[1,1]});
    }
    assert.equal(numKeys,"1");
    assert.equal(action,"like");
    assert.equal(key,"foco:social:likes:javascript-em-10-dias");
    assert.match(identifier,/^[0-9a-f]{64}$/);
    assert.match(script,/SADD/);
    return Response.json({result:4});
  };
  try{
    const res=await handler.fetch(req("POST",{id:"javascript-em-10-dias",action:"like",visitorId}));
    assert.equal(res.status,200);
    assert.deepEqual(await res.json(),{id:"javascript-em-10-dias",kind:"likes",count:4,liked:true});
    assert.equal(calls,2);
  }finally{restore();}
});

test("integração Upstash pelo Vercel Marketplace aceita KV_REST_API_URL e KV_REST_API_TOKEN",async()=>{
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.KV_REST_API_URL = "https://marketplace.upstash.io";
  process.env.KV_REST_API_TOKEN = "marketplace-token";
  process.env.SOCIAL_ID_SECRET = "v".repeat(32);
  globalThis.fetch = async (url,options) => {
    assert.equal(options.headers.authorization,"Bearer marketplace-token");
    if (url === "https://marketplace.upstash.io") {
      return Response.json({result:[1,1]});
    }
    assert.equal(url,"https://marketplace.upstash.io/pipeline");
    const commands=JSON.parse(options.body);
    return Response.json(commands.map(()=>({result:0})));
  };
  try {
    const response=await handler.fetch(req());
    assert.equal(response.status,200);
    const {stats}=await response.json();
    assert.deepEqual(stats["javascript-em-10-dias"],{likes:0,listeners:0});
  } finally { restore(); }
});

test("segredo de identidade continua obrigatório mesmo com Redis vinculado",async()=>{
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  process.env.KV_REST_API_URL = "https://marketplace.upstash.io";
  process.env.KV_REST_API_TOKEN = "marketplace-token";
  delete process.env.SOCIAL_ID_SECRET;
  try {
    const response=await handler.fetch(req());
    assert.equal(response.status,503);
  } finally { restore(); }
});

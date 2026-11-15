import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import socialApi from "../api/social.js";

const originalFetch = globalThis.fetch;
const envKeys = ["UPSTASH_REDIS_REST_URL","UPSTASH_REDIS_REST_TOKEN","KV_REST_API_URL","KV_REST_API_TOKEN","SOCIAL_ID_SECRET"];
const originalEnv = Object.fromEntries(envKeys.map(key => [key,process.env[key]]));
const slug = "javascript-em-10-dias";
const visitorId = "123e4567-e89b-42d3-a456-426614174000";
const URL = "https://classroommusic.vercel.app/api/social";
function configure() {
  process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  process.env.SOCIAL_ID_SECRET = "a".repeat(64);
}
function restore() {
  for(const key of envKeys) {
    if(originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
  globalThis.fetch = originalFetch;
}
function post(body, headers={}) {
  return new Request(URL, {
    method:"POST",
    headers: {"origin":"https://classroommusic.vercel.app","content-type":"application/json",...headers},
    body: typeof body === "string" ? body : JSON.stringify(body)
  });
}
const payload = {id:slug,action:"like",visitorId};
function fakeRedis({minute=1,day=1,scard=1,counts=[]}={}) {
  const commands=[];
  globalThis.fetch = async (url,options) => {
    const command=JSON.parse(options.body);
    commands.push({url,command});
    if(url.endsWith("/pipeline")) return Response.json(
      Array.from({length:14},(_,i)=>({result: counts[i] ?? 0}))
    );
    if(command[0]==="EVAL" && command[2]==="2") return Response.json({result:[minute,day]});
    if(command[0]==="EVAL" && command[2]==="1") return Response.json({result:scard});
    throw new Error("Unexpected Redis command");
  };
  return commands;
}
test("recusa POST sem Origin, com origem nula ou externa, sem acessar o Redis", async()=>{
  configure();
  let calls=0; globalThis.fetch=async()=>{calls++;throw Error("should not call Redis");};
  try {
    for(const origin of ["","null","https://evil.example"]) {
      const headers={origin};
      const response=await socialApi.fetch(post(payload,headers));
      assert.equal(response.status,403,origin);
    }
    const malicious=await socialApi.fetch(post(payload,{"sec-fetch-site":"cross-site"}));
    assert.equal(malicious.status,403);
    assert.equal(calls,0);
  } finally {restore();}
});
test("somente application/json e estrutura exata são aceitos",async()=>{
  configure();
  try {
    const wrongType=await socialApi.fetch(post(payload,{"content-type":"text/plain"}));
    assert.equal(wrongType.status,415);
    const more=await socialApi.fetch(post({...payload,admin:true}));
    assert.equal(more.status,400);
    const list=await socialApi.fetch(post([payload]));
    assert.equal(list.status,400);
    const malformed=await socialApi.fetch(post("{ malformed"));
    assert.equal(malformed.status,400);
  } finally {restore();}
});
test("corpos grandes são rejeitados por bytes com ou sem Content-Length", async()=>{
  configure();
  try {
    const oversized=JSON.stringify({...payload,padding:"á".repeat(150)});
    const response=await socialApi.fetch(post(oversized));
    assert.equal(response.status,413);
    const claimed=await socialApi.fetch(post(JSON.stringify(payload),{"content-length":"10000"}));
    assert.equal(claimed.status,413);
  } finally {restore();}
});
test("limita GET antes dos SCARD: 429 sem consultar contadores",async()=>{
  configure();
  try{
    const commands=fakeRedis({minute:31,day:100});
    const response=await socialApi.fetch(new Request(URL));
    assert.equal(response.status,429);
    assert.equal((await response.json()).error,"Muitas consultas. Tente novamente mais tarde.");
    assert.equal(commands.length,1);
    assert.match(commands[0].command[3],/rate:get/);
    assert.match(response.headers.get("cache-control"),/no-store/);
    assert.equal(response.headers.get("x-content-type-options"),"nosniff");
  }finally{restore();}
});
test("limite diário protege GET mesmo com contador por minuto baixo",async()=>{
  configure();
  try{
    fakeRedis({minute:1,day:1001});
    const response=await socialApi.fetch(new Request(URL));
    assert.equal(response.status,429);
  }finally{restore();}
});
test("limita POST antes do SADD/SREM e responde com 429", async()=>{
  configure();
  try{
    const commands=fakeRedis({minute:61,day:80});
    const response=await socialApi.fetch(post(payload));
    assert.equal(response.status,429);
    assert.equal(commands.length,1);
    assert.match(commands[0].command[3],/rate:post/);
  }finally{restore();}
});
test("POST legítimo continua disponível sem login e usa UUID anonimizado",async()=>{
  configure();
  try{
    const commands=fakeRedis({scard:7});
    const response=await socialApi.fetch(post({...payload,visitorId:visitorId.toUpperCase()}));
    assert.equal(response.status,200);
    assert.deepEqual(await response.json(),{id:slug,kind:"likes",count:7,liked:true});
    assert.equal(commands.length,2);
    assert.match(commands[1].command[5],/^[0-9a-f]{64}$/);
    assert.equal(commands[1].command[2],"1");
    assert.equal(commands[1].command[4],"like");
  }finally{restore();}
});
test("headers globais defendem contra framing, XSS e captura de sensores preservando VLibras",()=>{
  const config=JSON.parse(readFileSync(new globalThis.URL("../vercel.json",import.meta.url),"utf8"));
  const headers=Object.fromEntries(config.headers.find(item=>item.source==="/(.*)").headers.map(x=>[x.key,x.value]));
  const csp=headers["Content-Security-Policy"];
  assert.match(csp,/script-src 'self' https:\/\/vlibras\.gov\.br/);
  assert.doesNotMatch(csp,/script-src[^;]*'unsafe-inline'/);
  assert.match(csp,/object-src 'none'/);
  assert.match(csp,/base-uri 'self'/);
  assert.match(csp,/frame-ancestors 'none'/);
  assert.match(csp,/frame-src https:\/\/vlibras\.gov\.br/);
  assert.match(csp,/font-src[^;]*https:\/\/cdn\.jsdelivr\.net/);
  assert.match(csp,/connect-src 'self'/);
  assert.equal(headers["X-Frame-Options"],"DENY");
  assert.equal(headers["X-Content-Type-Options"],"nosniff");
  assert.match(headers["Strict-Transport-Security"],/max-age=31536000/);
  assert.match(headers["Permissions-Policy"],/camera=\(\), microphone=\(\), geolocation=\(\)/);
  assert.ok(!headers["Permissions-Policy"].includes("web-share=()"));
  assert.ok(config.headers.some(item=>item.source==="/api/social" && item.headers.some(h=>h.key==="Cache-Control" && h.value==="no-store")));
});

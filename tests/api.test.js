import test from "node:test";
import assert from "node:assert/strict";
import {artistNames,safeHttpsUrl,playableTracks,searchTracks,LICENSED_STREAMING,PAGE_SIZE} from "../src/api.js";
const track=id=>({id,title:"Soft Coding",artists:[[1,{id:"artist",name:"Someone"}]],is_premium:false,duration:120,files:{mp3:"https://cdn.example.org/audio.mp3"}});
test("MP3 externo permanece bloqueado sem licença",()=>assert.equal(LICENSED_STREAMING,false));
test("artistas seguem pares da especificação",()=>{
  assert.equal(artistNames(track("x")),"Someone");
  assert.equal(artistNames({artists:[]}),"Artista não informado");
});
test("URLs aceitam apenas HTTPS",()=>{
  assert.equal(safeHttpsUrl("http://example.org/song.mp3"),"");
  assert.equal(safeHttpsUrl("javascript:alert(1)"),"");
  assert.equal(safeHttpsUrl("https://example.org/song.mp3"),"https://example.org/song.mp3");
});
test("filtragem auxilia seleção de faixas não premium",()=>{
 const premium={...track("p"),is_premium:true};
 const unsafe={...track("u"),files:{mp3:"javascript:alert(1)"}};
 assert.deepEqual(playableTracks([track("a"),premium,unsafe]).map(x=>x.id),["a"]);
});
test("busca envia query e faz paginação por proxy da Vercel",async()=>{
 let request="";
 const result=await searchTracks("lofi",{fetcher:async(url)=>{
   request=url;return {ok:true,json:async()=>({data:[track("x")],pagination:{count:1}})};
 }});
 assert.equal(result.tracks.length,1);
 assert.equal(result.count,1);
 assert.equal(result.offset,PAGE_SIZE);
 const parsed=new URL(request,"https://foco.test");
 assert.equal(parsed.pathname,"/catalog-api/music/tracks/search");
 assert.equal(parsed.searchParams.get("query"),"lofi");
});
test("falha com estrutura inválida da API",async()=>{
 await assert.rejects(searchTracks("test",{fetcher:async()=>({ok:true,json:async()=>({data:null})})}),/Resposta inválida/);
});

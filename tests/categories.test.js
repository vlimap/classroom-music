import test from "node:test";
import assert from "node:assert/strict";
import {getCategories,getCategoryTracks,searchTracks,LICENSED_STREAMING,normalizeTracks} from "../src/api.js";
const catId="12345678-1234-1234-1234-123456789012";
const mock=async(url)=>({ok:true,json:async()=>({data:url.includes("categories/all")?[{id:catId,name:"Lo-fi",type:"Genre",thumbnails:{md:"https://example.org/lofi.png"}}]:[{id:catId,title:"Chill",artists:[[1,{name:"Autora"}]],thumbnails:{md:"https://example.org/cover.jpg"},duration:90}],pagination:{count:1}})});
test("categorias retornam capas da própria API",async()=>{
 const data=await getCategories({fetcher:mock});
 assert.equal(data[0].artwork,"https://example.org/lofi.png");
});
test("rewrites atendem categoria e pesquisa por mesma origem",async()=>{
 let last="";
 const fetcher=async url=>{last=url;return mock(url)};
 await getCategoryTracks(catId,{fetcher});
 assert.match(last,/^\/catalog-api\/music\/categories\//);
 await searchTracks("lofi",{fetcher});
 assert.match(last,/^\/catalog-api\/music\/tracks\/search\?/);
});
test("mapeia capas e metadados e mantém gravações externas bloqueadas",()=>{
 assert.equal(normalizeTracks([{id:"x",title:"Song",thumbnails:{md:"https://example.org/image.png"}}])[0].artwork,"https://example.org/image.png");
 assert.equal(LICENSED_STREAMING,false);
});

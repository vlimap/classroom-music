import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve,dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ORIGINAL_TRACKS } from "../src/music.js";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const load=path=>readFileSync(resolve(root,path),"utf8");
const html=load("index.html"),css=load("src/styles/app.css"),main=load("src/main.js");
test("capas originais existentes e individuais",()=>{
 const ids=new Set();
 for(const t of ORIGINAL_TRACKS){
  assert.ok(t.artwork.startsWith("/covers/"));
  assert.ok(existsSync(resolve(root,"."+t.artwork)));
  assert.equal(ids.has(t.artwork),false);
  ids.add(t.artwork);
 }
});
test("navegação inferior mobile completa e com rótulos",()=>{
 assert.match(html,/aria-label="Navegação inferior"/);
 for(const v of ["discover","search","playlists","queue","access"])
  assert.ok(html.includes('data-view="'+v+'"'),v);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(html,/bootstrap-icons@1\.13\.2/);
});
test("nova interface exibe categorias, criação e compartilhamento",()=>{
 for(const id of ["category-grid","category-tracks","playlist-grid","create-top","share-dialog","share-link"])
   assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(main,/function readSharedLink\(/);
 assert.match(main,/function fetchCategories\(/);
 assert.match(main,/function openPlaylist\(/);
});
test("proxy da Vercel encaminha apenas requisições previstas",()=>{
 const config=JSON.parse(load("vercel.json"));
 assert.deepEqual(config.rewrites,[{source:"/catalog-api/:path*",destination:"https://api.freetouse.com/v3/:path*"}]);
});

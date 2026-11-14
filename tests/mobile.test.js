import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve,dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ORIGINAL_TRACKS } from "../src/music.js";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const load=path=>readFileSync(resolve(root,path),"utf8");
const html=load("index.html"),css=load("src/styles/app.css"),main=load("src/main.js");
test("capas individuais mapeadas ao pacote de mídia",()=>{
 assert.equal(new Set(ORIGINAL_TRACKS.map(t=>t.artwork)).size,4);
 for(const t of ORIGINAL_TRACKS)assert.ok(t.artwork.includes(t.id));
});
test("navegação mobile: ícones, rótulos e safe-area",()=>{
 assert.match(html,/aria-label="Navegação inferior"/);
 for(const v of ["discover","podcasts","playlists","queue","access"])
  assert.ok(html.includes('data-view="'+v+'"'),v);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(html,/bootstrap-icons@1\.13\.2/);
});
test("player, playlists e podcasts intactos",()=>{
 for(const id of ["category-grid","category-tracks","playlist-grid","create-top","share-dialog","share-link","file-player"])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(main,/function readSharedLink\(/);
 assert.match(main,/function openPlaylist\(/);
 assert.match(main,/published\.audio/);
 for(const id of ["view-podcasts","view-episode","episode-transcript","episode-sources","transcript-copy"])
  assert.ok(html.includes('id="'+id+'"'),id);
});
test("sem consultas a FreeToUse na interface",()=>{
 assert.doesNotMatch(main,/getCategories|getCategoryTracks|searchTracks|api\.freetouse/);
});

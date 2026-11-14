import test from "node:test";
import assert from "node:assert/strict";
import { ORIGINAL_TRACKS, CATEGORIES, formatTime, nextIndex, previousIndex, timeDescription } from "../src/music.js";
test("tempo legível e acessível", () => {
 assert.equal(formatTime(125.9),"2:05");assert.equal(formatTime(-8),"0:00");
 assert.equal(timeDescription(72),"1 minuto e 12 segundos");
});
test("fila: avanço, aleatório e repetição", () => {
 assert.equal(nextIndex(0,4),1);
 assert.equal(nextIndex(3,4),-1);
 assert.equal(nextIndex(3,4,"all"),0);
 assert.equal(nextIndex(2,4,"one"),2);
 assert.equal(nextIndex(0,0),-1);
 assert.notEqual(nextIndex(2,4,"off",true,()=>0),2);
 assert.equal(previousIndex(0,3),0);
 assert.equal(previousIndex(0,3,"all"),2);
});
test("quatro faixas vlimap e sete categorias próprias", () => {
 assert.equal(ORIGINAL_TRACKS.length,4);assert.equal(CATEGORIES.length,7);
 assert.equal(new Set(ORIGINAL_TRACKS.map(t=>t.id)).size,4);
 for(const t of ORIGINAL_TRACKS) {
  assert.equal(t.source,"published");assert.equal(t.artist,"vlimap");
  assert.ok(t.audio.startsWith("/audio/")&&t.audio.endsWith(".mp3"));
  assert.ok(t.artwork.startsWith("/covers/")&&t.artwork.endsWith(".jpg"));
  assert.equal(t.duration,180);
  assert.ok(CATEGORIES.some(c=>c.id===t.categoryId));
 }
});

test("as categorias próprias têm arte sem texto e tipo editorial",()=>{
 for(const c of CATEGORIES){
  assert.match(c.artwork,/^\/covers\/categories\/[a-z-]+\.svg$/);
  assert.ok(["music","podcast"].includes(c.kind));
 }
 assert.ok(CATEGORIES.some(c=>c.id==="podcasts"));
});

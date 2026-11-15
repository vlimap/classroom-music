import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PODCAST_EPISODES, getPodcast } from "../src/podcasts.js";

test("episódios de tecnologia ficam preparados para publicação",()=>{
 assert.equal(PODCAST_EPISODES.length,12);
 assert.deepEqual(PODCAST_EPISODES.map(item=>item.id),[
  "javascript-em-10-dias","margaret-hamilton-apollo-11","da-apollo-11-ao-caos-do-javascript","morris-worm-1988",
  "linus-torvalds-linux-e-git","bug-ariane-5","bug-do-milenio","dez-dolares-wannacry",
  "ada-lovelace-primeiro-algoritmo","eliza-ao-gpt-4o","alan-turing-enigma","leis-de-asimov"
 ]);
 for(const item of PODCAST_EPISODES){
  assert.equal(item.categoryId,"podcasts"); assert.equal(item.producer,"vlimap");
  assert.match(item.credits,/vlimap/); assert.match(item.audio,/^\/audio\/podcasts\/.*\.(?:mp3|m4a)$/);
  assert.ok(item.duration >= 0); assert.deepEqual(item.sourceLinks,[]);
  assert.equal(getPodcast(item.id),item);
 }
});

test("páginas e componentes do podcast são acessíveis",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
 for(const id of ["view-podcasts","view-episode","view-about","episode-play","episode-summary","episode-sources"]) assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(main,/method:"HEAD"/); assert.match(main,/contentType\.startsWith\("audio\//);
 assert.match(main,/search-query.*addEventListener\("input"/s);
 assert.doesNotMatch(main,/api\.freetouse|getCategoryTracks|ORIGINAL_TRACKS/);
});

test("controles de áudio ausente começam ocultos",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const ui=readFileSync(new URL("../src/podcast-ui.js",import.meta.url),"utf8");
 const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
 assert.match(html,/id="episode-play"[^>]*disabled hidden/);
 assert.match(ui,/\$\("episode-play"\)\.hidden = !ready/); assert.match(main,/\$\("play"\)\.hidden=!t/);
});

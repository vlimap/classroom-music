import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync,existsSync } from "node:fs";
import { PODCAST_EPISODES, getPodcast } from "../src/podcasts.js";
import { CATEGORIES,ORIGINAL_TRACKS } from "../src/music.js";

test("podcast autoral com data, transcrição e fontes HTTPS",()=>{
 assert.equal(PODCAST_EPISODES.length,1);
 const episode=PODCAST_EPISODES[0];
 assert.equal(episode.date,"2026-11-14");
 assert.equal(episode.categoryId,"podcasts");
 assert.equal(episode.artist,"vlimap");
 assert.equal(episode.transcriptReviewed,false);
 assert.equal(getPodcast(episode.id),episode);
 assert.match(episode.audio,/^\/audio\/podcasts\/.*\.mp3$/);
 assert.match(episode.transcript,/^\/content\/podcasts\/.*\.txt$/);
 assert.ok(CATEGORIES.some(c=>c.id==="podcasts"&&c.kind==="podcast"));
 assert.equal(episode.sourceLinks.length,6);
 for(const source of episode.sourceLinks){
  const uri=new URL(source.url);
  assert.equal(uri.protocol,"https:");
  assert.ok(source.publisher.trim());
 }
});

test("arquivo de transcrição original preserva os marcadores do Adobe",()=>{
 const episode=PODCAST_EPISODES[0];
 const path=new URL(".."+episode.transcript,import.meta.url);
 assert.ok(existsSync(path));
 const raw=readFileSync(path,"utf8");
 assert.match(raw,/Podaodcast de hoje/);
 assert.match(raw,/00:00:00 Speaker:/);
 assert.match(raw,/Bleeding Computer/);
 assert.match(raw,/Face Stiller/);
});

test("páginas e componentes do podcast são acessíveis mesmo sem MP3",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
 const ui=readFileSync(new URL("../src/podcast-ui.js",import.meta.url),"utf8");
 for(const id of ["view-podcasts","view-episode","transcript-download","transcript-copy","episode-play","episode-sources"]){
  assert.ok(html.includes('id="'+id+'"'),id);
 }
 assert.match(ui,/response\.text\(\)/);
 assert.match(ui,/textContent = text/);
 assert.match(ui,/navigator\.clipboard\.writeText/);
 assert.match(main,/method:"HEAD"/);
 assert.match(main,/contentType\.startsWith\("audio\/"/);
 assert.doesNotMatch(main,/api\.freetouse|getCategoryTracks/);
});

test("controles de áudio ausente começam ocultos e são liberados somente após verificação",()=>{
 const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
 const ui=readFileSync(new URL("../src/podcast-ui.js",import.meta.url),"utf8");
 const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
 assert.match(html,/id="episode-play"[^>]*disabled hidden/);
 assert.match(html,/id="episode-add"[^>]*disabled hidden/);
 assert.match(html,/id="play"[^>]*disabled hidden/);
 assert.match(ui,/\$\("episode-play"\)\.hidden = !ready/);
 assert.match(main,/\$\("play"\)\.hidden=!t/);
});

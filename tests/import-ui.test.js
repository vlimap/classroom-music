import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
const tokens=readFileSync(new URL("../src/styles/tokens.css",import.meta.url),"utf8");
const styles=readFileSync(new URL("../src/styles/app.css",import.meta.url),"utf8");
test("painel de importação removido sem quebrar player ou playlists anteriores",()=>{
  for(const id of ["import-audio","audio-picker","local-audio-list"])
    assert.ok(!html.includes('id="'+id+'"'),id);
  assert.ok(html.includes('id="file-player"'));
  assert.match(main,/function initAudioLibrary\(/);
  for(const fn of ["initAudioLibrary","playFromTrack","findVLibrasButton","prepareSelected"])
    assert.ok(main.includes("function "+fn+"("));
  assert.match(main,/URL\.createObjectURL\(record\.blob\)/);
  assert.match(main,/URL\.revokeObjectURL\(fileObjectUrl\)/);
});
test("integração oficial do VLibras mantém foco e marca",()=>{
  assert.match(main,/window\.VLibrasWidget\?\.initBtn/);
  assert.match(html,/vlibras-access-foco\.svg/);
  assert.match(styles,/#315d49/i);
  assert.match(tokens,/--vlibras-btn-focus-visible-outline/);
});

test("VLibras mantém acionador original para delegar evento a botão visual da marca",()=>{
  assert.ok(html.includes('id="vlibras-fab"'));
  assert.match(main,/function findVLibrasButton\(/);
  assert.match(main,/native\.click\(\)/);
  assert.match(main,/dataset\.vlibrasBranded/);
});

import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
const tokens=readFileSync(new URL("../src/styles/tokens.css",import.meta.url),"utf8");
test("interface possui importador e engine HTMLAudioElement",()=>{
  for(const id of ["import-audio","audio-picker","local-audio-list","file-player"])
    assert.ok(html.includes('id="'+id+'"'),id);
  for(const fn of ["initAudioLibrary","playFromTrack","styleVLibrasButton","prepareSelected"])
    assert.ok(main.includes("function "+fn+"("));
  assert.match(main,/URL\.createObjectURL\(record\.blob\)/);
  assert.match(main,/URL\.revokeObjectURL\(fileObjectUrl\)/);
});
test("integração oficial do VLibras mantém foco e marca",()=>{
  assert.match(main,/window\.VLibrasWidget\?\.initBtn/);
  assert.match(main,/#315d49/i);
  assert.match(tokens,/--vlibras-btn-focus-visible-outline/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORIES, formatTime, nextIndex, previousIndex, timeDescription } from "../src/music.js";
test("tempo legível e acessível", () => {
 assert.equal(formatTime(125.9),"2:05"); assert.equal(formatTime(-8),"0:00");
 assert.equal(timeDescription(72),"1 minuto e 12 segundos");
});
test("fila: avanço, aleatório e repetição", () => {
 assert.equal(nextIndex(0,4),1); assert.equal(nextIndex(3,4),-1);
 assert.equal(nextIndex(3,4,"all"),0); assert.equal(nextIndex(2,4,"one"),2);
 assert.equal(nextIndex(0,0),-1); assert.notEqual(nextIndex(2,4,"off",true,()=>0),2);
 assert.equal(previousIndex(0,3),0); assert.equal(previousIndex(0,3,"all"),2);
});
test("o catálogo não contém mais categorias musicais", () => {
 assert.equal(CATEGORIES.length, 1);
 assert.equal(CATEGORIES[0].id, "podcasts");
 assert.equal(CATEGORIES[0].kind, "podcast");
});

import test from "node:test";
import assert from "node:assert/strict";
import { ORIGINAL_TRACKS, formatTime, nextIndex, previousIndex, timeDescription } from "../src/music.js";

test("formatTime sanitiza números inválidos", () => {
  assert.equal(formatTime(0), "0:00");
  assert.equal(formatTime(125.9), "2:05");
  assert.equal(formatTime(-8), "0:00");
  assert.equal(formatTime(NaN), "0:00");
});
test("descrição acessível de tempo", () => {
  assert.equal(timeDescription(72), "1 minutos e 12 segundos");
});
test("avanço automático e limite da fila", () => {
  assert.equal(nextIndex(0, 4), 1);
  assert.equal(nextIndex(3, 4), -1);
  assert.equal(nextIndex(3, 4, "all"), 0);
  assert.equal(nextIndex(2, 4, "one"), 2);
  assert.equal(nextIndex(0, 0), -1);
});
test("ordem aleatória não repete a faixa atual", () => {
  const index = nextIndex(2, 4, "off", true, () => 0);
  assert.notEqual(index, 2);
  assert.ok(index >= 0 && index < 4);
});
test("anterior respeita início e modo de repetição", () => {
  assert.equal(previousIndex(0, 3), 0);
  assert.equal(previousIndex(0, 3, "all"), 2);
  assert.equal(previousIndex(2, 3), 1);
});
test("trilhas originais são completas e distintas", () => {
  assert.equal(new Set(ORIGINAL_TRACKS.map((track) => track.id)).size, ORIGINAL_TRACKS.length);
  for (const track of ORIGINAL_TRACKS) {
    assert.ok(track.duration > 60);
    assert.ok(track.bpm >= 60);
    assert.equal(track.chords.length, 4);
  }
});

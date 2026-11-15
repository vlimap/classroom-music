import test from "node:test";
import assert from "node:assert/strict";
import { LISTENER_THRESHOLD_SECONDS, RETRY_DELAY_MS, playedSeconds, createListeningTracker } from "../src/listening.js";

function ranges(...segments) {
  return {
    length: segments.length,
    start: index => segments[index][0],
    end: index => segments[index][1]
  };
}
function makeAudio() {
  const listeners = new Map();
  return {
    played: ranges(),
    addEventListener(name, fn) {
      const handlers = listeners.get(name) || [];
      handlers.push(fn);
      listeners.set(name, handlers);
    },
    trigger(name) { for (const callback of listeners.get(name) || []) callback(); }
  };
}
const flushed = () => new Promise(resolve => setImmediate(resolve));

test("calcula só os intervalos realmente reproduzidos e ignora saltos", () => {
  assert.equal(playedSeconds(ranges([0, 10], [100, 104])), 14);
  assert.equal(playedSeconds(ranges([0, 5], [50, 75])), 30);
  assert.equal(playedSeconds(ranges([0, 5], [50, 49])), 5);
  assert.equal(playedSeconds(null), 0);
  assert.equal(LISTENER_THRESHOLD_SECONDS, 30);
});

test("Android: um timeupdate tardio após 31 segundos contabiliza sem exigir pequenos deltas", async () => {
  const audio = makeAudio();
  const ids = [];
  createListeningTracker({
    audio, getEpisodeId: () => "linus-torvalds-linux-e-git",
    onQualified: async id => { ids.push(id); return true; }
  });
  audio.played = ranges([0, 6]);
  audio.trigger("timeupdate");
  assert.equal(ids.length, 0);
  audio.played = ranges([0, 31.1]);
  audio.trigger("timeupdate");
  await flushed();
  audio.trigger("timeupdate");
  assert.deepEqual(ids, ["linus-torvalds-linux-e-git"]);
});

test("seek para 10 minutos e pausa não contam 30 segundos não reproduzidos", async () => {
  const audio = makeAudio();
  let calls = 0;
  createListeningTracker({
    audio, getEpisodeId: () => "morris-worm-1988",
    onQualified: async () => { calls++; return true; }
  });
  audio.played = ranges([0, 3], [600, 605]);
  audio.trigger("seeked");
  audio.trigger("pause");
  await flushed();
  assert.equal(calls, 0);
  audio.played = ranges([0, 3], [600, 627]);
  audio.trigger("pause");
  await flushed();
  assert.equal(calls, 1);
});

test("POST com falha usa cooldown e permite novo registro após 30 segundos", async () => {
  const audio = makeAudio();
  audio.played = ranges([0, 34]);
  let clock = 1_000;
  let attempts = 0;
  createListeningTracker({
    audio, getEpisodeId: () => "bug-do-milenio",
    now: () => clock,
    onQualified: async () => ++attempts >= 2
  });
  audio.trigger("timeupdate");
  await flushed();
  audio.trigger("timeupdate");
  await flushed();
  assert.equal(attempts, 1);
  clock += RETRY_DELAY_MS;
  audio.trigger("timeupdate");
  await flushed();
  assert.equal(attempts, 2);
  clock += RETRY_DELAY_MS;
  audio.trigger("timeupdate");
  await flushed();
  assert.equal(attempts, 2);
});

test("ao mudar de episódio, reinicia o estado sem confundir contagens", async () => {
  const audio = makeAudio();
  let current = "bug-ariane-5";
  const ids = [];
  const tracker = createListeningTracker({
    audio, getEpisodeId: () => current,
    onQualified: async id => { ids.push(id); return true; }
  });
  audio.played = ranges([0, 31]);
  audio.trigger("timeupdate");
  await flushed();
  current = "javascript-em-10-dias";
  tracker.reset(current);
  audio.played = ranges([0, 12]);
  audio.trigger("timeupdate");
  await flushed();
  assert.deepEqual(ids, ["bug-ariane-5"]);
  audio.played = ranges([0, 32]);
  audio.trigger("ended");
  await flushed();
  assert.deepEqual(ids, ["bug-ariane-5", "javascript-em-10-dias"]);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PODCAST_EPISODES } from "../src/podcasts.js";
import { filterPodcastEpisodes } from "../src/search.js";
import { sortPodcastsByEngagement, reorderPodcastCards } from "../src/ranking.js";

const sample = PODCAST_EPISODES.slice(0, 4);
const snapshot = metrics => id => metrics[id];

test("ordena por soma de curtidas e ouvintes, com ambos os indicadores relevantes", () => {
  const metrics = {
    [sample[0].id]: {likes: 12, listeners: 0},
    [sample[1].id]: {likes: 2, listeners: 15},
    [sample[2].id]: {likes: 6, listeners: 6},
    [sample[3].id]: {likes: 0, listeners: 1}
  };
  assert.deepEqual(
    sortPodcastsByEngagement(sample, snapshot(metrics)).map(item => item.id),
    [sample[1].id, sample[2].id, sample[0].id, sample[3].id]
  );
});

test("desempata engajamento por ouvintes, curtidas e ordem editorial original", () => {
  const metrics = {
    [sample[0].id]: {likes: 7, listeners: 3},
    [sample[1].id]: {likes: 3, listeners: 7},
    [sample[2].id]: {likes: 3, listeners: 7},
    [sample[3].id]: {likes: 9, listeners: 0}
  };
  assert.deepEqual(
    sortPodcastsByEngagement(sample, snapshot(metrics)).map(item => item.id),
    [sample[1].id, sample[2].id, sample[0].id, sample[3].id]
  );
});

test("sem Redis e com contadores inválidos mantém ordenação editorial sem inventar números", () => {
  const original = sample.map(item => item.id);
  assert.deepEqual(sortPodcastsByEngagement(sample, () => undefined).map(item => item.id), original);
  assert.deepEqual(sortPodcastsByEngagement(sample, snapshot({
    [sample[0].id]: {likes: null, listeners: -3},
    [sample[1].id]: {likes: NaN, listeners: "100"},
    [sample[2].id]: {likes: Infinity, listeners: 0}
  })).map(item => item.id), original);
  assert.deepEqual(sample.map(item => item.id), original, "não modifica o array original");
});

test("nova curtida ou 30 segundos de áudio altera o ranking sem novo carregamento de página", () => {
  const counts = {
    [sample[0].id]: {likes: 1, listeners: 0},
    [sample[1].id]: {likes: 0, listeners: 0}
  };
  const two = sample.slice(0, 2);
  assert.equal(sortPodcastsByEngagement(two, snapshot(counts))[0].id, sample[0].id);
  counts[sample[1].id].listeners = 2;
  assert.equal(sortPodcastsByEngagement(two, snapshot(counts))[0].id, sample[1].id);
  counts[sample[0].id].likes = 3;
  assert.equal(sortPodcastsByEngagement(two, snapshot(counts))[0].id, sample[0].id);
});

test("busca instantânea preserva ranking entre os resultados filtrados", () => {
  const matches = filterPodcastEpisodes(PODCAST_EPISODES, "apollo");
  assert.ok(matches.length > 1, "há mais de um episódio com Apollo");
  const metrics = Object.fromEntries(matches.map((episode, index) =>
    [episode.id, {likes: index * 3, listeners: 0}]
  ));
  const ranked = sortPodcastsByEngagement(matches, snapshot(metrics));
  assert.equal(ranked[0].id, matches.at(-1).id);
  assert.deepEqual(ranked.map(item => item.id).sort(), matches.map(item => item.id).sort());
});

test("reordenação dos cards move nós existentes sem substituir listeners nem duplicar elementos", () => {
  const original = sample.map(episode => ({dataset: {podcastId: episode.id}, identity: Symbol(episode.id)}));
  const grid = {
    children: [...original],
    insertBefore(node, reference) {
      const index = this.children.indexOf(node);
      if (index !== -1) this.children.splice(index, 1);
      const target = reference === null ? this.children.length : this.children.indexOf(reference);
      this.children.splice(target, 0, node);
    }
  };
  const order = [sample[2], sample[0], sample[3], sample[1]];
  reorderPodcastCards(grid, order);
  assert.deepEqual(grid.children, [original[2], original[0], original[3], original[1]]);
  assert.equal(new Set(grid.children).size, original.length);
  reorderPodcastCards(grid, order);
  assert.deepEqual(grid.children, [original[2], original[0], original[3], original[1]]);
  reorderPodcastCards(null, order);
});

test("integração utiliza ranking nos dois catálogos e reage às alterações do Redis", () => {
  const ui = readFileSync(new URL("../src/podcast-ui.js", import.meta.url), "utf8");
  const social = readFileSync(new URL("../src/social.js", import.meta.url), "utf8");
  const main = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
  assert.match(ui, /sortPodcastsByEngagement\(PODCAST_EPISODES, id => social\.snapshot\(id\)\)/);
  assert.match(ui, /reorder\(\$\("podcast-grid"\), sorted\)/);
  assert.match(ui, /reorder\(discoverGrid, filterPodcastEpisodes\(sorted, query\)\)/);
  assert.match(ui, /discoverGrid\.replaceChildren\(makeFragment\(matches\)\)/);
  assert.match(ui, /focused\.focus\(\{preventScroll: true\}\)/);
  assert.match(main, /onChange:\(\)=>podcastUI\?\.updateSocial\(\)/);
  assert.match(main, /void social\.refresh\(\)/);
  assert.match(social, /totals\.likes = result\.count/);
  assert.match(social, /totals\.listeners = result\.count/);
});

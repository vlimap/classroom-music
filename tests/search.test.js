import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PODCAST_EPISODES } from "../src/podcasts.js";
import { normalizeSearchText, filterPodcastEpisodes } from "../src/search.js";

test("busca ignora caixa, acentos e espaços excedentes", () => {
  assert.equal(normalizeSearchText("  SegUrAnÇa  "), "seguranca");
  assert.equal(normalizeSearchText("  Ariáne 5 "), "ariane 5");
});

test("mostra todos os episódios quando o campo está vazio ou é limpo", () => {
  assert.equal(filterPodcastEpisodes(PODCAST_EPISODES, "").length, PODCAST_EPISODES.length);
  assert.equal(filterPodcastEpisodes(PODCAST_EPISODES, "   ").length, PODCAST_EPISODES.length);
});

test("filtra pelo título, assunto e múltiplas palavras conforme o usuário digita", () => {
  const javascript = filterPodcastEpisodes(PODCAST_EPISODES, "javascript");
  assert.ok(javascript.some(episode => episode.id === "javascript-em-10-dias"));
  assert.ok(javascript.every(episode => /javascript/i.test(
    [episode.title, episode.description, episode.summary].join(" ")
  )));

  const ariane = filterPodcastEpisodes(PODCAST_EPISODES, "ÁRIANE");
  assert.deepEqual(ariane.map(episode => episode.id), ["bug-ariane-5"]);

  const linus = filterPodcastEpisodes(PODCAST_EPISODES, "  linux GIT ");
  assert.deepEqual(linus.map(episode => episode.id), ["linus-torvalds-linux-e-git"]);

  const segurança = filterPodcastEpisodes(PODCAST_EPISODES, "seguranca");
  assert.ok(segurança.some(episode => episode.id === "morris-worm-1988"));
});

test("busca sem resultados devolve lista vazia sem inventar episódios", () => {
  assert.deepEqual(filterPodcastEpisodes(PODCAST_EPISODES, "tema-impossivel-007"), []);
  assert.deepEqual(filterPodcastEpisodes([], "javascript"), []);
});

test("descoberta filtra cards na mesma página, sem trocar o foco para outra view", () => {
  const main = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
  const ui = readFileSync(new URL("../src/podcast-ui.js", import.meta.url), "utf8");
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(main, /\$\("discover-search-query"\)\.addEventListener\("input",\(\)=>podcastUI\?\.renderList\(\)\)/);
  const submit = main.split('$("discover-search-form").addEventListener("submit"')[1]?.split('$("search-form").addEventListener')[0];
  assert.ok(submit);
  assert.doesNotMatch(submit, /setView\("search"\)/);
  assert.match(ui, /const matches = filterPodcastEpisodes\(sorted, query\)/);
  assert.match(ui, /const sorted = sortPodcastsByEngagement\(PODCAST_EPISODES, id => social\.snapshot\(id\)\)/);
  assert.match(ui, /discoverGrid\.replaceChildren\(makeFragment\(matches\)\)/);
  assert.match(ui, /\$\("discover-search-empty"\)\.hidden = matches\.length !== 0/);
  assert.match(html, /id="discover-search-empty"[^>]*hidden/);
});

test("botão VLibras fica fixo no meio da viewport sem invadir player nem menu inferior", () => {
  const css = readFileSync(new URL("../src/styles/app.css", import.meta.url), "utf8");
  assert.match(css, /position:fixed;right:14px;top:50%;top:50dvh;bottom:auto;transform:translateY\(-50%\)/);
  assert.doesNotMatch(css, /\.vlibras-fab\{[^}]*bottom:calc\(175px/);
  assert.doesNotMatch(css, /body\[data-expanded="true"\] \.vlibras-fab\{bottom/);
  assert.match(css, /\.mobile-nav\{position:fixed/);
});

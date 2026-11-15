import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { PODCAST_EPISODES } from "../src/podcasts.js";
import episodeApi, { episodeStructuredData, episodeUrl, socialCoverUrl, renderEpisodeHtml, escapeHtml } from "../api/episode.js";
import sitemapApi, { renderSitemap } from "../api/sitemap.js";
import feedApi, { renderFeed, AUDIO_FILE_BYTES } from "../api/feed.js";
import { getEpisodeShareUrl } from "../src/share.js";

const load = path => readFileSync(new URL(path, import.meta.url), "utf8");
const origin = "https://classroommusic.vercel.app";
const ld = html => {
  const script = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(script, "JSON-LD presente no HTML inicial");
  return JSON.parse(script[1]);
};
test("cada episódio tem URL canônica distinta, indexável e com capa própria no HTML inicial", async () => {
  for (const episode of PODCAST_EPISODES) {
    const url = episodeUrl(episode.id);
    const response = await episodeApi.fetch(new Request(origin + "/api/episode?slug=" + episode.id));
    assert.equal(response.status, 200, episode.id);
    assert.match(response.headers.get("content-type"), /text\/html/);
    const html = await response.text();
    assert.ok(html.includes('rel="canonical" href="' + url + '"'));
    assert.ok(html.includes('<meta property="og:url" content="' + url + '">'));
    assert.ok(html.includes('property="og:title" content="' + escapeHtml(episode.title + " | Foco.dev") + '"'));
    assert.ok(html.includes('property="og:image" content="' + socialCoverUrl(episode) + '"'));
    assert.ok(html.includes('<meta name="twitter:card" content="summary_large_image">'));
    assert.ok(html.includes('<meta name="twitter:image" content="' + socialCoverUrl(episode) + '">'));
    assert.ok(html.includes("<h1>" + escapeHtml(episode.title) + "</h1>"));
    assert.ok(html.includes(escapeHtml(episode.summary)));
    assert.ok(html.includes('href="/?episode=' + episode.id + '"'));
    assert.match(html, /max-image-preview:large/);
    assert.doesNotMatch(html, /<meta name="keywords"/);
    assert.ok(statSync(fileURLToPath(new URL(".." + episode.artwork, import.meta.url))).isFile());
    const jpegFile = readFileSync(new URL("../covers/social/" + episode.id + ".jpg", import.meta.url));
    assert.equal(jpegFile[0], 0xff);
    assert.equal(jpegFile[1], 0xd8);
    assert.equal(jpegFile[2], 0xff);
    assert.ok(jpegFile.length < 5_000_000);
    assert.ok(html.includes('<meta property="og:image:width" content="1200">'));
    assert.ok(html.includes('<meta property="og:image:height" content="630">'));
  }
});
test("JSON-LD relaciona PodcastSeries, PodcastEpisode, AudioObject e BreadcrumbList sem inventar datas", () => {
  for (const episode of PODCAST_EPISODES) {
    const nodes = ld(renderEpisodeHtml(episode))["@graph"];
    const media = nodes.find(item => item["@type"] === "PodcastEpisode");
    assert.equal(media.name, episode.title);
    assert.equal(media.url, episodeUrl(episode.id));
    assert.equal(media.associatedMedia.contentUrl, origin + episode.audio);
    assert.equal(media.associatedMedia.encodingFormat, "audio/mp4");
    assert.equal(media.isPartOf["@id"], origin + "/#podcast-series");
    assert.equal(media.inLanguage, "pt-BR");
    assert.equal(media.isAccessibleForFree, true);
    assert.ok(nodes.some(node => node["@type"] === "PodcastSeries"));
    assert.ok(nodes.some(node => node["@type"] === "BreadcrumbList"));
    assert.ok(!("datePublished" in media), "ano histórico não é data de publicação");
  }
});
test("escapa metadados e blocos estruturados contra HTML editorial inseguro", () => {
  const hostile = {...PODCAST_EPISODES[0], title: '</script><script>alert("x")</script>', description: '<em>& text'};
  const html = renderEpisodeHtml(hostile);
  assert.ok(html.includes("&lt;em&gt;&amp; text"));
  assert.ok(html.includes("\\u003c/script>"));
  assert.ok(!html.includes('<script>alert("x")</script>'));
});
test("API de episódio não encontrado retorna 404, noindex e HEAD sem corpo", async () => {
  const missing = await episodeApi.fetch(new Request(origin + "/api/episode?slug=episodio-inexistente"));
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /name="robots" content="noindex"/);
  const head = await episodeApi.fetch(new Request(origin + "/api/episode?slug=bug-ariane-5", {method:"HEAD"}));
  assert.equal(head.status, 200);
  assert.equal(await head.text(), "");
});
test("sitemap inclui página principal, cada permalink e respectiva imagem", async () => {
  const xml = renderSitemap();
  assert.equal((xml.match(/<url>/g) || []).length, PODCAST_EPISODES.length + 1);
  assert.ok(xml.includes("<loc>" + origin + "/</loc>"));
  for (const episode of PODCAST_EPISODES) {
    assert.ok(xml.includes("<loc>" + episodeUrl(episode.id) + "</loc>"));
    assert.ok(xml.includes("<image:loc>" + origin + episode.artwork + "</image:loc>"));
  }
  assert.doesNotMatch(xml, /<lastmod>/, "não adicionar datas de atualização fictícias");
  const response = await sitemapApi.fetch(new Request(origin + "/api/sitemap"));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/xml/);
});
test("RSS contém áudios reais e seus tamanhos corretos, sem datas fictícias", async () => {
  const xml = renderFeed();
  assert.equal((xml.match(/<item>/g) || []).length, PODCAST_EPISODES.length);
  for (const episode of PODCAST_EPISODES) {
    const file = new URL(".." + episode.audio, import.meta.url);
    assert.equal(AUDIO_FILE_BYTES[episode.id], statSync(fileURLToPath(file)).size);
    assert.ok(xml.includes('url="' + origin + episode.audio + '"'));
    assert.ok(xml.includes('length="' + AUDIO_FILE_BYTES[episode.id] + '"'));
  }
  assert.doesNotMatch(xml, /<pubDate>/);
  const response = await feedApi.fetch(new Request(origin + "/api/feed"));
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/rss\+xml/);
});
test("home expõe OG, sitemap, RSS, links rastreáveis e botão de compartilhar", () => {
  const html = load("../index.html");
  const robots = load("../robots.txt");
  const redirects = JSON.parse(load("../vercel.json"));
  assert.ok(html.includes('rel="canonical" href="' + origin + '/"'));
  assert.ok(html.includes('property="og:image"'));
  assert.ok(html.includes('name="twitter:card" content="summary_large_image"'));
  assert.ok(html.includes('id="episode-share"'));
  assert.ok(html.includes('rel="alternate" type="application/rss+xml"'));
  assert.equal((html.match(/<a href="\/podcasts\//g) || []).length, PODCAST_EPISODES.length);
  for(const episode of PODCAST_EPISODES) assert.ok(html.includes('href="/podcasts/' + episode.id + '"'));
  assert.ok(robots.includes("Sitemap: " + origin + "/sitemap.xml"));
  assert.ok(redirects.rewrites.some(item => item.source === "/podcasts/:slug" && item.destination.includes(":slug")));
  assert.ok(redirects.rewrites.some(item => item.source === "/sitemap.xml"));
  assert.ok(redirects.rewrites.some(item => item.source === "/feed.xml"));
});
test("compartilhamento usa links canônicos individuais e deep-link para o player", () => {
  const ui = load("../src/podcast-ui.js");
  const main = load("../src/main.js");
  for(const episode of PODCAST_EPISODES)
    assert.equal(getEpisodeShareUrl(episode.id), episodeUrl(episode.id));
  assert.match(ui, /sharePodcast\(episode, announce\)/);
  assert.match(ui, /sharePodcast\(activeEpisode, announce\)/);
  assert.match(main, /new URLSearchParams\(window.location.search\).get\("episode"\)/);
  assert.match(main, /podcastUI.openEpisode\(initialEpisode\)/);
  assert.match(load("../src/share.js"), /navigator\.share/);
  assert.match(load("../src/share.js"), /navigator\.clipboard/);
});

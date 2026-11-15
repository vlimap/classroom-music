import { PODCAST_EPISODES } from "../src/podcasts.js";
import { SITE_URL, episodeUrl } from "./episode.js";

// Tamanhos reais dos arquivos de áudio versionados no repositório (bytes).
// tests/seo.test.js valida que estes tamanhos correspondem aos arquivos.
export const AUDIO_FILE_BYTES = Object.freeze({
  "javascript-em-10-dias": 22203506,
  "margaret-hamilton-apollo-11": 14216583,
  "da-apollo-11-ao-caos-do-javascript": 8863546,
  "morris-worm-1988": 13307850,
  "linus-torvalds-linux-e-git": 12205382,
  "bug-ariane-5": 9141767,
  "bug-do-milenio": 16860759,
  "dez-dolares-wannacry": 27207244,
  "ada-lovelace-primeiro-algoritmo": 13016679,
  "eliza-ao-gpt-4o": 10148708,
  "alan-turing-enigma": 13543274,
  "grace-hopper-codigo-imperfeito": 19376250
});

function xml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;"
  })[char]);
}

export function renderFeed() {
  const entries = PODCAST_EPISODES.map(episode => {
    const url = episodeUrl(episode.id);
    const bytes = AUDIO_FILE_BYTES[episode.id];
    if (!Number.isSafeInteger(bytes) || bytes <= 0) {
      throw new Error("Tamanho do áudio não informado no catálogo RSS: " + episode.id);
    }
    return [
      "    <item>",
      "      <title>" + xml(episode.title) + "</title>",
      "      <description>" + xml(episode.summary || episode.description) + "</description>",
      "      <link>" + xml(url) + "</link>",
      '      <guid isPermaLink="true">' + xml(url) + "</guid>",
      '      <enclosure url="' + xml(SITE_URL + episode.audio) +
        '" length="' + bytes + '" type="audio/mp4"/>',
      "    </item>"
    ].join("\n");
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    "    <title>Foco.dev — Podcasts de tecnologia</title>",
    "    <link>" + SITE_URL + "/</link>",
    "    <description>Histórias de software, engenharia e pessoas que mudaram a tecnologia.</description>",
    "    <language>pt-BR</language>",
    '    <atom:link href="' + SITE_URL + '/feed.xml" rel="self" type="application/rss+xml"/>',
    ...entries,
    "  </channel>",
    "</rss>"
  ].join("\n");
}

export default {
  async fetch(request) {
    if (!["GET", "HEAD"].includes(request.method))
      return new Response(null, {status:405,headers:{allow:"GET, HEAD"}});
    return new Response(request.method === "HEAD" ? null : renderFeed(), {
      status:200,headers:{
        "content-type":"application/rss+xml; charset=utf-8",
        "cache-control":"public,max-age=0,s-maxage=3600,stale-while-revalidate=3600"
      }
    });
  }
};

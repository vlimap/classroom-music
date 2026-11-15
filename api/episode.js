import { getPodcast, PODCAST_EPISODES } from "../src/podcasts.js";

export const SITE_URL = "https://classroommusic.vercel.app";
export const episodeUrl = id => SITE_URL + "/podcasts/" + encodeURIComponent(id);
export const coverUrl = episode => SITE_URL + episode.artwork;

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}
export function toIsoDuration(value) {
  if (!Number.isFinite(value) || value <= 0) return undefined;
  const seconds = Math.round(value);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remaining = seconds % 60;
  return "PT" + (hours ? hours + "H" : "") +
    (minutes ? minutes + "M" : "") +
    (remaining || (!hours && !minutes) ? remaining + "S" : "");
}
const ld = obj => JSON.stringify(obj).replace(/</g, "\\u003c");
const makeMeta = (key, value, property = false) =>
  '<meta ' + (property ? "property" : "name") + '="' + key +
  '" content="' + escapeHtml(value) + '">';
const organization = {
  "@type": "Organization", "@id": SITE_URL + "/#publisher",
  name: "Foco.dev", url: SITE_URL + "/",
  sameAs: ["https://github.com/vlimap/classroom-music"]
};

export function episodeStructuredData(episode) {
  const url = episodeUrl(episode.id);
  const duration = toIsoDuration(episode.duration);
  return {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "WebSite", "@id": SITE_URL + "/#website",
        name: "Foco.dev", url: SITE_URL + "/", inLanguage: "pt-BR",
        description: "Podcasts sobre tecnologia, histórias de software e engenharia.",
        publisher: {"@id": organization["@id"]}
      },
      {
        "@type": "PodcastSeries", "@id": SITE_URL + "/#podcast-series",
        name: "Foco.dev — Podcasts de tecnologia", url: SITE_URL + "/",
        description: "Histórias de software, engenharia e pessoas que mudaram a tecnologia.",
        inLanguage: "pt-BR", publisher: {"@id": organization["@id"]}
      },
      {
        "@type": "PodcastEpisode", "@id": url + "#episode",
        url, name: episode.title, description: episode.description,
        abstract: episode.summary || episode.description,
        image: coverUrl(episode),
        inLanguage: "pt-BR", isAccessibleForFree: true,
        isPartOf: {"@id": SITE_URL + "/#podcast-series"},
        publisher: {"@id": organization["@id"]},
        mainEntityOfPage: url,
        associatedMedia: {
          "@type": "AudioObject", name: episode.title,
          contentUrl: SITE_URL + episode.audio, encodingFormat: "audio/mp4",
          inLanguage: "pt-BR", ...(duration ? { duration } : {})
        },
        ...(duration ? { duration } : {})
      },
      {
        "@type": "BreadcrumbList", "@id": url + "#breadcrumb",
        itemListElement: [
          {"@type": "ListItem", position: 1, name: "Foco.dev", item: SITE_URL + "/"},
          {"@type": "ListItem", position: 2, name: episode.title, item: url}
        ]
      }
    ]
  };
}

export function renderEpisodeHtml(episode) {
  const e = escapeHtml;
  const url = episodeUrl(episode.id);
  const image = coverUrl(episode);
  const isHistorical = /^\d/.test(episode.date);
  const context = isHistorical ? "Contexto histórico: " + episode.date : "Edição especial";
  const duration = Math.round(episode.duration || 0);
  const durationText = duration
    ? Math.floor(duration / 60) + " min " + String(duration % 60).padStart(2, "0") + " s"
    : "Duração não informada";
  const related = PODCAST_EPISODES
    .filter(other => other.id !== episode.id)
    .slice(0, 4)
    .map(other => '<li><a href="/podcasts/' + encodeURIComponent(other.id) +
      '">' + e(other.title) + '</a></li>').join("\n");

  const tags = [
    makeMeta("description", episode.description),
    makeMeta("robots", "index,follow,max-image-preview:large"),
    makeMeta("author", "Foco.dev — Produção e curadoria: vlimap"),
    makeMeta("og:type", "article", true),
    makeMeta("og:site_name", "Foco.dev", true),
    makeMeta("og:locale", "pt_BR", true),
    makeMeta("og:title", episode.title + " | Foco.dev", true),
    makeMeta("og:description", episode.description, true),
    makeMeta("og:url", url, true),
    makeMeta("og:image", image, true),
    makeMeta("og:image:secure_url", image, true),
    makeMeta("og:image:type", "image/webp", true),
    makeMeta("og:image:alt", "Arte de capa do podcast " + episode.title, true),
    makeMeta("og:audio", SITE_URL + episode.audio, true),
    makeMeta("og:audio:type", "audio/mp4", true),
    makeMeta("twitter:card", "summary_large_image"),
    makeMeta("twitter:title", episode.title + " | Foco.dev"),
    makeMeta("twitter:description", episode.description),
    makeMeta("twitter:image", image),
    makeMeta("twitter:image:alt", "Arte de capa do podcast " + episode.title)
  ].join("\n  ");

  return [
    "<!doctype html>",
    '<html lang="pt-BR">',
    "<head>",
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
    '  <meta name="theme-color" content="#111714">',
    "  <title>" + e(episode.title) + " | Foco.dev — Podcast</title>",
    "  " + tags,
    '  <link rel="canonical" href="' + e(url) + '">',
    '  <link rel="alternate" type="application/rss+xml" title="RSS dos podcasts Foco.dev" href="/feed.xml">',
    '  <link rel="icon" type="image/svg+xml" href="/logo.svg">',
    '  <script type="application/ld+json">' + ld(episodeStructuredData(episode)) + '</script>',
    '  <link rel="stylesheet" href="/src/styles/tokens.css">',
    '  <link rel="stylesheet" href="/src/styles/episode.css">',
    "</head>",
    "<body>",
    '  <a class="skip-link" href="#content">Pular para o conteúdo</a>',
    '  <header class="public-header"><a class="public-brand" href="/">',
    '    <img src="/logo.svg" alt="" width="44" height="44">',
    '    <span><strong>foco.dev</strong><small>Podcasts sobre tecnologia</small></span></a>',
    '    <a class="public-home" href="/">Explorar todos os podcasts</a></header>',
    '  <main class="public-main" id="content">',
    '    <nav class="breadcrumb" aria-label="Navegação estrutural"><a href="/">Foco.dev</a><span aria-hidden="true">/</span><span>Episódio</span></nav>',
    '    <article class="public-article">',
    '      <img class="public-cover" src="' + e(episode.artwork) +
      '" alt="' + e("Arte de capa do podcast " + episode.title) +
      '" width="1200" height="675" decoding="async" fetchpriority="high">',
    '      <div class="public-content">',
    '        <p class="public-label">Podcast de tecnologia · ' + e(context) + '</p>',
    '        <h1>' + e(episode.title) + '</h1>',
    '        <p class="public-deck">' + e(episode.description) + '</p>',
    '        <p class="public-duration">Duração: ' + e(durationText) + '</p>',
    '        <a class="public-play" href="/?episode=' + encodeURIComponent(episode.id) +
      '">Ouvir episódio no player Foco.dev</a>',
    '        <p class="public-credits">' + e(episode.credits) + '</p>',
    '        <section aria-labelledby="resumo"><h2 id="resumo">Sobre este episódio</h2>',
    '          <p>' + e(episode.summary || episode.description) + '</p></section>',
    '      </div>',
    '    </article>',
    '    <nav class="related" aria-label="Outros episódios">',
    '      <h2>Outros episódios sobre tecnologia</h2><ul>' + related + '</ul>',
    '    </nav>',
    '  </main>',
    '  <footer class="public-footer"><a href="/">Foco.dev</a> · Conteúdo editorial de tecnologia · ',
    '    <a href="https://github.com/vlimap/classroom-music" rel="noopener noreferrer">Projeto no GitHub</a></footer>',
    "</body></html>"
  ].join("\n");
}

export default {
  async fetch(request) {
    if (!["GET", "HEAD"].includes(request.method))
      return new Response(null, {status:405, headers:{allow:"GET, HEAD"}});
    const slug = new URL(request.url).searchParams.get("slug") || "";
    const episode = /^[a-z0-9-]{3,100}$/.test(slug) ? getPodcast(slug) : null;
    if (!episode) {
      const html = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Episódio não encontrado | Foco.dev</title></head><body><main><h1>Episódio não encontrado</h1><a href="/">Ver podcasts</a></main></body></html>';
      return new Response(request.method === "HEAD" ? null : html, {
        status:404, headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}
      });
    }
    return new Response(request.method === "HEAD" ? null : renderEpisodeHtml(episode), {
      status:200,
      headers:{
        "content-type":"text/html; charset=utf-8",
        "cache-control":"public, max-age=0, s-maxage=3600, stale-while-revalidate=3600",
        "x-content-type-options":"nosniff"
      }
    });
  }
};
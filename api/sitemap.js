import { PODCAST_EPISODES } from "../src/podcasts.js";
import { SITE_URL, episodeUrl, coverUrl, escapeHtml } from "./episode.js";

export function renderSitemap() {
  const home = '  <url><loc>' + SITE_URL + '/</loc></url>';
  const items = PODCAST_EPISODES.map(episode =>
    '  <url><loc>' + escapeHtml(episodeUrl(episode.id)) +
    '</loc><image:image><image:loc>' + escapeHtml(coverUrl(episode)) +
    '</image:loc></image:image></url>'
  );
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    home, ...items, '</urlset>'
  ].join("\n");
}
export default {
  async fetch(request) {
    if (!["GET", "HEAD"].includes(request.method)) return new Response(null, {status:405,headers:{allow:"GET, HEAD"}});
    return new Response(request.method === "HEAD" ? null : renderSitemap(), {
      status:200,
      headers: {
        "content-type":"application/xml; charset=utf-8",
        "cache-control":"public,max-age=0,s-maxage=3600,stale-while-revalidate=3600"
      }
    });
  }
};
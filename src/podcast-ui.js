import { PODCAST_EPISODES, getPodcast } from "./podcasts.js";

const $ = id => document.getElementById(id);

export function createPodcastUI({ showView, playEpisode, addEpisode, isAvailable }) {
  let activeEpisode = null;

  function formatEpisodeDate(isoDate) {
    if (/^\d{4}(?:[–-]\d{4})?$/.test(isoDate)) return isoDate;
    const parsed = new Date(isoDate + "T12:00:00");
    if (Number.isNaN(parsed.getTime())) return isoDate || "Episódio especial";
    return parsed.toLocaleDateString("pt-BR", {
      timeZone: "UTC", day: "numeric", month: "long", year: "numeric"
    });
  }

  function episodeCard(episode, priority = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "podcast-card";
    const image = document.createElement("img");
    image.src = episode.cardArtwork || episode.artwork;
    image.alt = "";
    image.width = 320;
    image.height = 180;
    image.decoding = "async";
    image.loading = priority ? "eager" : "lazy";
    if (priority) image.fetchPriority = "high";
    const description = document.createElement("span");
    description.className = "podcast-card-body";
    const date = document.createElement("small");
    date.textContent = formatEpisodeDate(episode.date);
    const title = document.createElement("strong");
    title.textContent = episode.title;
    const status = document.createElement("span");
    status.className = "podcast-card-status";
    status.textContent = isAvailable(episode.id) ? "Ouvir episódio" : "Áudio em preparação";
    description.append(date, title, status);
    button.append(image, description);
    button.addEventListener("click", () => openEpisode(episode.id));
    return button;
  }

  function renderList() {
    const makeFragment = () => {
      const fragment = document.createDocumentFragment();
      PODCAST_EPISODES.forEach((episode, index) => fragment.append(episodeCard(episode, index === 0)));
      return fragment;
    };
    $("podcast-grid").replaceChildren(makeFragment());
    const discoverGrid = $("discover-podcast-grid");
    if (discoverGrid) discoverGrid.replaceChildren(makeFragment());
    $("podcasts-status").textContent = PODCAST_EPISODES.length + " episódio(s).";
  }

  function updateAudioAvailability() {
    const ready = Boolean(activeEpisode && isAvailable(activeEpisode.id));
    $("episode-play").disabled = !ready;
    $("episode-play").hidden = !ready;
    $("episode-play").setAttribute("aria-disabled", String(!ready));
    $("episode-audio-status").textContent = ready
      ? "Áudio pronto para reprodução no player Foco.dev."
      : "Áudio ainda não disponível.";
    if ($("view-podcasts").hidden === false) renderList();
  }

  function renderSources(episode) {
    const fragment = document.createDocumentFragment();
    for (const source of episode.sourceLinks) {
      const item = document.createElement("li");
      const anchor = document.createElement("a");
      anchor.href = source.url;
      anchor.rel = "noopener noreferrer";
      anchor.target = "_blank";
      anchor.textContent = source.publisher + " — " + source.label + " (nova aba)";
      item.append(anchor);
      fragment.append(item);
    }
    $("episode-sources").replaceChildren(fragment);
  }

  function openEpisode(id) {
    const episode = getPodcast(id);
    if (!episode) return;
    activeEpisode = episode;
    $("episode-title").textContent = episode.title;
    $("episode-date").textContent = formatEpisodeDate(episode.date) + " · " + episode.artist;
    $("episode-description").textContent = episode.description;
    $("episode-summary").textContent = episode.summary || episode.description;
    $("episode-artwork").src = episode.artwork;
    $("episode-sources-section").hidden = !episode.sourceLinks.length;
    renderSources(episode);
    updateAudioAvailability();
    showView("episode");
  }

  function openPodcasts() {
    renderList();
    showView("podcasts");
  }

  $("back-podcasts").addEventListener("click", openPodcasts);
  $("episode-play").addEventListener("click", () => {
    if (activeEpisode && isAvailable(activeEpisode.id)) playEpisode(activeEpisode);
  });

  return { openPodcasts, openEpisode, renderList, updateAudioAvailability };
}

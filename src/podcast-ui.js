import { PODCAST_EPISODES, getPodcast } from "./podcasts.js";
import { filterPodcastEpisodes, normalizeSearchText } from "./search.js";
import { sharePodcast } from "./share.js";

const $ = id => document.getElementById(id);

export function createPodcastUI({ showView, playEpisode, addEpisode, isAvailable, social, announce = () => {} }) {
  let activeEpisode = null;

  function formatEpisodeDate(isoDate) {
    if (/^\d{4}(?:[–-]\d{4})?$/.test(isoDate)) return isoDate;
    const parsed = new Date(isoDate + "T12:00:00");
    if (Number.isNaN(parsed.getTime())) return isoDate || "Episódio especial";
    return parsed.toLocaleDateString("pt-BR", {
      timeZone: "UTC", day: "numeric", month: "long", year: "numeric"
    });
  }

  function updateSocialCard(card) {
    const id = card.dataset.podcastId;
    const stats = social.snapshot(id);
    const like = card.querySelector(".podcast-like");
    const likeLabel = like.querySelector(".podcast-like-count");
    const likeIcon = like.querySelector(".bi");
    const listeners = card.querySelector(".podcast-listeners");
    const formattedLikes = stats.likes === null ? "—" : social.formatNumber(stats.likes);
    const formattedListeners = stats.listeners === null ? "—" : social.formatNumber(stats.listeners);
    like.setAttribute("aria-pressed", String(stats.liked));
    like.setAttribute("aria-label", (stats.liked ? "Descurtir" : "Curtir") + " " + card.dataset.podcastTitle);
    like.title = stats.available ? (stats.liked ? "Remover curtida" : "Curtir episódio") : "Curtidas temporariamente indisponíveis";
    like.disabled = !stats.available || stats.pending;
    likeIcon.className = "bi " + (stats.liked ? "bi-heart-fill" : "bi-heart");
    likeLabel.textContent = formattedLikes + " curtida" + (stats.likes === 1 ? "" : "s");
    listeners.textContent = "";
    const headphone = document.createElement("i");
    headphone.className = "bi bi-headphones";
    headphone.setAttribute("aria-hidden", "true");
    const text = document.createElement("span");
    text.textContent = formattedListeners + " ouvinte" + (stats.listeners === 1 ? "" : "s");
    listeners.append(headphone, text);
    listeners.title = "Navegadores distintos que ouviram pelo menos 30 segundos";
  }

  function updateSocial() {
    document.querySelectorAll(".podcast-card[data-podcast-id]").forEach(updateSocialCard);
  }

  function episodeCard(episode, priority = false) {
    const card = document.createElement("article");
    card.className = "podcast-card";
    card.dataset.podcastId = episode.id;
    card.dataset.podcastTitle = episode.title;
    const open = document.createElement("button");
    open.type = "button";
    open.className = "podcast-card-open";
    open.setAttribute("aria-label", "Ver episódio: " + episode.title);
    const header = document.createElement("span");
    header.className = "podcast-card-header";
    const avatar = document.createElement("img");
    avatar.className = "podcast-card-avatar";
    avatar.src = "/logo.svg";
    avatar.width = 32;
    avatar.height = 32;
    avatar.alt = "";
    const brand = document.createElement("strong");
    brand.textContent = "foco.dev";
    const date = document.createElement("small");
    date.textContent = formatEpisodeDate(episode.date);
    header.append(avatar, brand, date);
    const image = document.createElement("img");
    image.className = "podcast-card-artwork";
    image.src = episode.cardArtwork || episode.artwork;
    image.alt = "";
    image.width = 320;
    image.height = 240;
    image.decoding = "async";
    image.loading = priority ? "eager" : "lazy";
    if (priority) image.fetchPriority = "high";
    const description = document.createElement("span");
    description.className = "podcast-card-body";
    const title = document.createElement("strong");
    title.textContent = episode.title;
    const status = document.createElement("span");
    status.className = "podcast-card-status";
    status.textContent = isAvailable(episode.id) ? "Ouvir episódio" : "Áudio em preparação";
    description.append(title, status);
    open.append(header, image, description);
    open.addEventListener("click", () => openEpisode(episode.id));

    const socialBar = document.createElement("div");
    socialBar.className = "podcast-social";
    const like = document.createElement("button");
    like.className = "podcast-like";
    like.type = "button";
    const icon = document.createElement("i");
    icon.className = "bi bi-heart";
    icon.setAttribute("aria-hidden", "true");
    const count = document.createElement("span");
    count.className = "podcast-like-count";
    like.append(icon, count);
    like.addEventListener("click", () => void social.toggleLike(episode.id));
    const share = document.createElement("button");
    share.className = "podcast-share";
    share.type = "button";
    share.title = "Compartilhar episódio";
    share.setAttribute("aria-label", "Compartilhar " + episode.title);
    const shareIcon = document.createElement("i");
    shareIcon.className = "bi bi-share";
    shareIcon.setAttribute("aria-hidden", "true");
    share.append(shareIcon);
    share.addEventListener("click", () => void sharePodcast(episode, announce));
    const listeners = document.createElement("span");
    listeners.className = "podcast-listeners";
    socialBar.append(like, share, listeners);
    card.append(open, socialBar);
    updateSocialCard(card);
    return card;
  }

  function renderList() {
    const makeFragment = episodes => {
      const fragment = document.createDocumentFragment();
      episodes.forEach((episode, index) => fragment.append(episodeCard(episode, index === 0)));
      return fragment;
    };

    $("podcast-grid").replaceChildren(makeFragment(PODCAST_EPISODES));
    const discoverGrid = $("discover-podcast-grid");
    if (discoverGrid) {
      const query = $("discover-search-query").value;
      const matches = filterPodcastEpisodes(PODCAST_EPISODES, query);
      discoverGrid.replaceChildren(makeFragment(matches));
      const isSearching = Boolean(normalizeSearchText(query));
      $("category-status").textContent = isSearching
        ? matches.length + (matches.length === 1 ? " episódio encontrado." : " episódios encontrados.")
        : PODCAST_EPISODES.length + " episódios de tecnologia.";
      $("discover-search-empty").hidden = matches.length !== 0;
    }
    $("podcasts-status").textContent = PODCAST_EPISODES.length + " episódio(s).";
    updateSocial();
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
  $("episode-share").addEventListener("click", () => {
    if (activeEpisode) void sharePodcast(activeEpisode, announce);
  });

  return { openPodcasts, openEpisode, renderList, updateAudioAvailability, updateSocial };
}

import { PODCAST_EPISODES, getPodcast } from "./podcasts.js";

const $ = id => document.getElementById(id);

export function createPodcastUI({ showView, playEpisode, addEpisode, isAvailable, announce }) {
  let activeEpisode = null;
  let loadedTranscript = "";
  let loadSequence = 0;

  function formatEpisodeDate(isoDate) {
    return new Date(isoDate + "T12:00:00").toLocaleDateString("pt-BR", {
      timeZone: "UTC", day: "numeric", month: "long", year: "numeric"
    });
  }

  function episodeCard(episode) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "podcast-card";
    button.setAttribute("aria-label", "Abrir " + episode.title + " e sua transcrição");
    const image = document.createElement("img");
    image.src = episode.artwork;
    image.alt = "";
    image.loading = "lazy";
    const description = document.createElement("span");
    description.className = "podcast-card-body";
    const date = document.createElement("small");
    date.textContent = formatEpisodeDate(episode.date);
    const title = document.createElement("strong");
    title.textContent = episode.title;
    const status = document.createElement("span");
    status.className = "podcast-card-status";
    status.textContent = isAvailable(episode.id)
      ? "Ouvir e ler transcrição" : "Transcrição disponível · áudio em preparação";
    description.append(date, title, status);
    button.append(image, description);
    button.addEventListener("click", () => void openEpisode(episode.id));
    return button;
  }

  function renderList() {
    const fragment = document.createDocumentFragment();
    for (const episode of PODCAST_EPISODES) fragment.append(episodeCard(episode));
    $("podcast-grid").replaceChildren(fragment);
    $("podcasts-status").textContent = PODCAST_EPISODES.length + " episódio(s) com transcrição disponível.";
  }

  function updateAudioAvailability() {
    const ready = Boolean(activeEpisode && isAvailable(activeEpisode.id));
    $("episode-play").disabled = !ready;
    $("episode-add").disabled = !ready;
    $("episode-audio-status").textContent = ready
      ? "Áudio pronto para reprodução no player Foco.dev."
      : "Áudio do Adobe Podcast ainda não enviado. A transcrição e as fontes já podem ser consultadas.";
    if ($("view-podcasts").hidden === false) renderList();
  }

  function renderSources(episode) {
    const list = $("episode-sources");
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
    list.replaceChildren(fragment);
  }

  async function loadTranscript(episode) {
    const sequence = ++loadSequence;
    loadedTranscript = "";
    $("transcript-copy").disabled = true;
    $("episode-transcript").textContent = "Carregando transcrição...";
    try {
      const response = await fetch(episode.transcript, { headers: { Accept: "text/plain" } });
      if (!response.ok) throw new Error("HTTP " + response.status);
      const text = await response.text();
      if (sequence !== loadSequence) return;
      loadedTranscript = text;
      $("episode-transcript").textContent = text;
      $("transcript-copy").disabled = false;
    } catch {
      if (sequence !== loadSequence) return;
      $("episode-transcript").textContent = "A transcrição está temporariamente indisponível.";
      announce("Falha ao carregar a transcrição do episódio.");
    }
  }

  async function openEpisode(id) {
    const episode = getPodcast(id);
    if (!episode) return;
    activeEpisode = episode;
    $("episode-title").textContent = episode.title;
    $("episode-date").textContent = formatEpisodeDate(episode.date) + " · produção e curadoria vlimap";
    $("episode-description").textContent = episode.description;
    $("episode-artwork").src = episode.artwork;
    $("transcript-download").href = episode.transcript;
    $("transcript-download").download = episode.transcript.split("/").pop();
    renderSources(episode);
    updateAudioAvailability();
    showView("episode");
    await loadTranscript(episode);
  }

  function openPodcasts() {
    renderList();
    showView("podcasts");
  }

  $("back-podcasts").addEventListener("click", openPodcasts);
  $("episode-play").addEventListener("click", () => {
    if (activeEpisode && isAvailable(activeEpisode.id)) playEpisode(activeEpisode);
  });
  $("episode-add").addEventListener("click", () => {
    if (activeEpisode && isAvailable(activeEpisode.id)) addEpisode(activeEpisode);
  });
  $("transcript-copy").addEventListener("click", async () => {
    if (!loadedTranscript) return;
    try {
      await navigator.clipboard.writeText(loadedTranscript);
      announce("Transcrição copiada.");
    } catch {
      announce("Não foi possível copiar automaticamente. Use o botão Baixar TXT.");
    }
  });

  return { openPodcasts, openEpisode, renderList, updateAudioAvailability };
}

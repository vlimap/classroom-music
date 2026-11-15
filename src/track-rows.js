const listenerText = (count, formatNumber) =>
  (count === null || count === undefined ? "—" : formatNumber(count)) +
  (count === 1 ? " ouvinte" : " ouvintes");

/** Um estado visual consistente para fila e resultados de busca. */
export function updateTrackRow(row, { selectedId, isPlaying, stats, formatNumber }) {
  const selected = row.dataset.podcastId === selectedId;
  const playing = selected && isPlaying;
  row.toggleAttribute("aria-current", selected);
  if (selected) row.setAttribute("aria-current", "true");
  row.dataset.playback = playing ? "playing" : selected ? "paused" : "idle";

  const button = row.querySelector(".song-play-toggle");
  if (button) {
    const action = playing ? "Pausar" : "Reproduzir";
    const label = action + " " + row.dataset.podcastTitle;
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", String(playing));
    button.title = label;
    button.querySelector(".bi").className = "bi " +
      (playing ? "bi-pause-fill" : "bi-play-fill");
  }

  const author = row.querySelector(".song-author");
  const playbackLabel = row.querySelector(".song-playback-status");
  if (author && playbackLabel) {
    author.hidden = playing;
    playbackLabel.hidden = !playing;
  }

  const listeners = row.querySelector(".song-listeners");
  if (listeners && stats) {
    listeners.textContent = "· " + listenerText(stats.listeners, formatNumber);
    listeners.title = "Navegadores que ouviram pelo menos 30 segundos";
  }
}

/**
 * Constrói a mesma linha sem duplicação entre Fila e Busca.
 * Dependências (catálogo, player, navegação) vêm dos callbacks do controlador.
 */
export function renderTrackList({
  container, tracks, canPlay, onToggle, hasDetails, onDetails,
  fallbackArtwork, formatDuration, onRendered
}) {
  const doc = container.ownerDocument;
  const fragment = doc.createDocumentFragment();

  const icon = name => {
    const element = doc.createElement("i");
    element.className = "bi bi-" + name;
    element.setAttribute("aria-hidden", "true");
    return element;
  };

  const action = (name, className, handler) => {
    const element = doc.createElement("button");
    element.type = "button";
    element.className = className;
    element.append(icon(name));
    element.addEventListener("click", handler);
    return element;
  };

  for (const track of tracks) {
    const row = doc.createElement("div");
    row.className = "song-row";
    row.dataset.podcastId = track.id;
    row.dataset.podcastTitle = track.title;

    const artwork = doc.createElement("img");
    artwork.alt = "";
    artwork.loading = "lazy";
    artwork.decoding = "async";
    const source = track.artwork;
    const isLocalCover = typeof source === "string" && source.startsWith("/covers/");
    const isHttps = typeof source === "string" && /^https:\/\//i.test(source);
    artwork.src = isLocalCover || isHttps ? source : fallbackArtwork(track);
    artwork.addEventListener("error", () => {
      const fallback = fallbackArtwork(track);
      if (!artwork.src.endsWith(fallback)) artwork.src = fallback;
    });

    const info = doc.createElement("div");
    info.className = "song-details";
    const name = doc.createElement("strong");
    name.textContent = track.title;
    const meta = doc.createElement("small");
    meta.className = "song-meta";
    const author = doc.createElement("span");
    author.className = "song-author";
    author.textContent = (track.artist || "Foco.dev") +
      (canPlay(track) ? "" : " · Áudio em preparação");
    const playbackStatus = doc.createElement("span");
    playbackStatus.className = "song-playback-status";
    playbackStatus.textContent = "Reproduzindo";
    playbackStatus.hidden = true;
    const listeners = doc.createElement("span");
    listeners.className = "song-listeners";
    meta.append(author, playbackStatus, listeners);
    info.append(name, meta);

    const time = doc.createElement("span");
    time.className = "song-time";
    time.textContent = Number.isFinite(track.duration) && track.duration > 0 ?
      formatDuration(track.duration) : "—";

    const actions = doc.createElement("div");
    actions.className = "song-actions";
    if (canPlay(track)) {
      actions.append(action("play-fill", "song-play-toggle", () => onToggle(track)));
    }
    if (hasDetails(track)) {
      const details = action("info-circle", "song-info-button", () => onDetails(track));
      details.setAttribute("aria-label", "Ver episódio " + track.title);
      details.title = "Ver episódio";
      actions.append(details);
    }

    row.append(artwork, info, time, actions);
    fragment.append(row);
  }

  container.replaceChildren(fragment);
  onRendered();
}

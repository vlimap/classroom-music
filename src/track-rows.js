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

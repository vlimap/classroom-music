/**
 * Conta os trechos que o navegador confirma como reproduzidos.
 * Diferentemente de currentTime, TimeRanges não conta saltos na barra.
 * Também suporta eventos timeupdate pouco frequentes no Android.
 */
export const LISTENER_THRESHOLD_SECONDS = 30;
export const RETRY_DELAY_MS = 30_000;

export function playedSeconds(ranges) {
  if (!ranges || !Number.isSafeInteger(ranges.length)) return 0;
  let seconds = 0;
  for (let index = 0; index < ranges.length; index++) {
    const start = ranges.start(index);
    const end = ranges.end(index);
    if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
      seconds += end - start;
    }
  }
  return seconds;
}

/**
 * Um tracker por elemento de áudio. O servidor deduplica a identidade,
 * enquanto o navegador confirma os 30s e evita POSTs repetidos.
 */
export function createListeningTracker({
  audio, getEpisodeId, onQualified,
  threshold = LISTENER_THRESHOLD_SECONDS,
  now = Date.now
}) {
  let episodeId = null;
  let counted = false;
  let pending = false;
  let retryAfter = 0;

  function reset(id = null) {
    episodeId = id;
    counted = false;
    pending = false;
    retryAfter = 0;
  }

  function update() {
    const id = getEpisodeId();
    if (!id) return;
    if (id !== episodeId) reset(id);
    if (counted || pending || now() < retryAfter) return;
    if (playedSeconds(audio.played) < threshold) return;

    pending = true;
    Promise.resolve()
      .then(() => onQualified(id))
      .then(success => {
        if (episodeId !== id) return;
        if (success) counted = true;
        else retryAfter = now() + RETRY_DELAY_MS;
      })
      .catch(() => {
        if (episodeId === id) retryAfter = now() + RETRY_DELAY_MS;
      })
      .finally(() => {
        if (episodeId === id) pending = false;
      });
  }

  // Eventos nativos são suficientes; sem timers de rastreamento.
  for (const event of ["timeupdate", "pause", "ended", "seeked"]) {
    audio.addEventListener(event, update);
  }

  return { reset, update };
}

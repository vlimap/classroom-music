/** Helpers puros compartilhados por player, fila e catálogo. */
export const PODCAST_CATEGORY = Object.freeze({
  id: "podcasts",
  name: "Podcasts de tecnologia",
  kind: "podcast",
  description: "Histórias, pessoas e decisões que mudaram a tecnologia.",
  artwork: "/logo.svg"
});

export const CATEGORIES = Object.freeze([PODCAST_CATEGORY]);

function wholeSeconds(value) {
  const seconds = Number(value);
  return Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
}

export function formatTime(seconds) {
  const total = wholeSeconds(seconds);
  return Math.floor(total / 60) + ":" +
    String(total % 60).padStart(2, "0");
}

export function timeDescription(seconds) {
  const total = wholeSeconds(seconds);
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return minutes + (minutes === 1 ? " minuto" : " minutos") +
    " e " + remainder + (remainder === 1 ? " segundo" : " segundos");
}

export function nextIndex(
  index, count, repeatMode = "off", shuffle = false, random = Math.random
) {
  if (count < 1) return -1;
  if (repeatMode === "one") return index;
  if (shuffle && count > 1) {
    const chance = Math.max(0, Math.min(0.999999, random()));
    const offset = Math.min(count - 2, Math.floor(chance * (count - 1)));
    return (index + 1 + offset) % count;
  }
  if (index + 1 < count) return index + 1;
  return repeatMode === "all" ? 0 : -1;
}

export function previousIndex(index, count, repeatMode = "off") {
  if (count < 1) return -1;
  if (index > 0) return index - 1;
  return repeatMode === "all" ? count - 1 : 0;
}

export function readJsonStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function saveJsonStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // O navegador pode bloquear o armazenamento local; o player continua útil.
  }
}

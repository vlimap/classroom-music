export const ORIGINAL_TRACKS = Object.freeze([
  { id: "noite-de-codigo", title: "Noite de código", artist: "Foco.dev · original", duration: 180, bpm: 74, root: 45, motif: [0, 4, 7, 9, 7, 4, 2, 0], chords: [[0, 3, 7, 10], [5, 9, 12, 15], [2, 5, 9, 12], [7, 10, 14, 17]] },
  { id: "terminal-aconchegante", title: "Terminal aconchegante", artist: "Foco.dev · original", duration: 210, bpm: 68, root: 48, motif: [7, 4, 2, 0, 4, 7, 9, 7], chords: [[0, 4, 7, 11], [9, 12, 16, 19], [5, 9, 12, 16], [7, 11, 14, 17]] },
  { id: "fluxo-de-ideias", title: "Fluxo de ideias", artist: "Foco.dev · original", duration: 195, bpm: 82, root: 43, motif: [0, 2, 5, 7, 10, 7, 5, 2], chords: [[0, 3, 7, 10], [8, 12, 15, 19], [5, 8, 12, 15], [7, 10, 14, 17]] },
  { id: "pausa-entre-commits", title: "Pausa entre commits", artist: "Foco.dev · original", duration: 180, bpm: 72, root: 50, motif: [0, 7, 5, 2, 4, 7, 11, 7], chords: [[0, 4, 7, 11], [5, 9, 12, 16], [9, 12, 16, 19], [7, 11, 14, 17]] }
]);

export function formatTime(seconds) {
  const n = Number.isFinite(Number(seconds)) ? Math.max(0, Math.floor(Number(seconds))) : 0;
  return String(Math.floor(n / 60)) + ":" + String(n % 60).padStart(2, "0");
}
export function timeDescription(seconds) {
  const n = Number.isFinite(Number(seconds)) ? Math.max(0, Math.floor(Number(seconds))) : 0;
  const minutes = Math.floor(n / 60); const secs = n % 60;
  return minutes + (minutes === 1 ? " minuto" : " minutos") + " e " + secs + (secs === 1 ? " segundo" : " segundos");
}
export function nextIndex(index, count, repeatMode = "off", shuffle = false, random = Math.random) {
  if (count < 1) return -1;
  if (repeatMode === "one") return index;
  if (shuffle && count > 1) {
    const offset = Math.min(count - 2, Math.floor(Math.max(0, Math.min(0.999999, random())) * (count - 1)));
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
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
export function saveJsonStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* armazenamento indisponível */ }
}

// Utilitários compartilhados pelo player e pelo catálogo de podcasts.
export const PODCAST_CATEGORY = Object.freeze({
  id: "podcasts",
  name: "Podcasts de tecnologia",
  kind: "podcast",
  description: "Histórias, pessoas e decisões que mudaram a tecnologia.",
  artwork: "/logo.svg"
});
export const CATEGORIES = Object.freeze([PODCAST_CATEGORY]);
export function formatTime(seconds) { const n = Number.isFinite(Number(seconds)) ? Math.max(0, Math.floor(Number(seconds))) : 0; return Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0"); }
export function timeDescription(seconds) { const n = Number.isFinite(Number(seconds)) ? Math.max(0, Math.floor(Number(seconds))) : 0; const minutes = Math.floor(n / 60); const secs = n % 60; return minutes + (minutes === 1 ? " minuto" : " minutos") + " e " + secs + (secs === 1 ? " segundo" : " segundos"); }
export function nextIndex(index, count, repeatMode = "off", shuffle = false, random = Math.random) { if (count < 1) return -1; if (repeatMode === "one") return index; if (shuffle && count > 1) { const offset = Math.min(count - 2, Math.floor(Math.max(0, Math.min(0.999999, random())) * (count - 1))); return (index + 1 + offset) % count; } if (index + 1 < count) return index + 1; return repeatMode === "all" ? 0 : -1; }
export function previousIndex(index, count, repeatMode = "off") { if (count < 1) return -1; if (index > 0) return index - 1; return repeatMode === "all" ? count - 1 : 0; }
export function readJsonStorage(key, fallback) { try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); } catch { return fallback; } }
export function saveJsonStorage(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Bloqueio do armazenamento */ } }

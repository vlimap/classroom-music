// Catálogo editorial Foco.dev Sessions, Volume 1.
// MP3s e artes são entregues separadamente pelo pacote de mídias.
// Produção/curadoria: vlimap. Geração assistida por Adobe Firefly.
export const CATEGORIES = Object.freeze([
  { id: "lofi-focus", name: "Lo-fi & Focus", kind: "music", description: "Ritmos tranquilos para estudar, programar e criar.", artwork: "/covers/categories/lofi.svg" },
  { id: "ambient-zen", name: "Ambient & Zen", kind: "music", description: "Texturas atmosféricas e ambientes relaxantes.", artwork: "/covers/categories/ambient.svg" },
  { id: "love-romance", name: "Love & Romance", kind: "music", description: "Melodias românticas autorais em produção.", artwork: "/covers/categories/love.svg" },
  { id: "rock-indie", name: "Rock & Indie", kind: "music", description: "Guitarras e composições originais em produção.", artwork: "/covers/categories/rock.svg" },
  { id: "jazz-coffee", name: "Jazz & Coffee", kind: "music", description: "Jazz suave e harmonias aconchegantes em produção.", artwork: "/covers/categories/jazz.svg" },
  { id: "electronic-chill", name: "Electronic & Chill", kind: "music", description: "Sintetizadores e eletrônica para concentração.", artwork: "/covers/categories/electronic.svg" },
  { id: "podcasts", name: "Podcasts & Notícias", kind: "podcast", description: "Episódios do Foco.dev News com transcrições e fontes.", artwork: "/covers/categories/podcasts.svg" }
]);

export const ORIGINAL_TRACKS = Object.freeze([
  { id: "noite-entre-commits", source: "published", title: "Noite entre Commits", artist: "vlimap", producer: "vlimap", categoryId: "lofi-focus", artwork: "/covers/noite-entre-commits.jpg", audio: "/audio/noite-entre-commits.mp3", duration: 180 },
  { id: "jardim-ao-amanhecer", source: "published", title: "Jardim ao Amanhecer", artist: "vlimap", producer: "vlimap", categoryId: "ambient-zen", artwork: "/covers/jardim-ao-amanhecer.jpg", audio: "/audio/jardim-ao-amanhecer.mp3", duration: 180 },
  { id: "caminho-da-floresta", source: "published", title: "Caminho da Floresta", artist: "vlimap", producer: "vlimap", categoryId: "ambient-zen", artwork: "/covers/caminho-da-floresta.jpg", audio: "/audio/caminho-da-floresta.mp3", duration: 180 },
  { id: "refugio-zen", source: "published", title: "Refúgio Zen", artist: "vlimap", producer: "vlimap", categoryId: "ambient-zen", artwork: "/covers/refugio-zen.jpg", audio: "/audio/refugio-zen.mp3", duration: 180 }
]);

export function formatTime(seconds) {
  const n = Number.isFinite(Number(seconds)) ? Math.max(0, Math.floor(Number(seconds))) : 0;
  return Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0");
}
export function timeDescription(seconds) {
  const n = Number.isFinite(Number(seconds)) ? Math.max(0, Math.floor(Number(seconds))) : 0;
  const minutes = Math.floor(n / 60);
  const secs = n % 60;
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
  } catch { return fallback; }
}
export function saveJsonStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Bloqueio do armazenamento */ }
}

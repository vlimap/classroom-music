const API = "https://api.freetouse.com/v3";
export const PAGE_SIZE = 24;
export const LICENSED_STREAMING = false;

export function artistNames(track) {
  const artists = Array.isArray(track?.artists) ? track.artists : [];
  const names = artists.map((entry) => Array.isArray(entry) ? entry[1]?.name : null).filter((name) => typeof name === "string" && name.trim());
  return names.length ? names.join(", ") : "Artista não informado";
}
export function safeHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch { return ""; }
}
export function playableTracks(value) {
  return (Array.isArray(value) ? value : []).filter((track) => (
    typeof track?.id === "string" &&
    typeof track?.title === "string" &&
    track.title.trim() &&
    track.is_premium !== true &&
    typeof track?.files?.mp3 === "string" &&
    Boolean(safeHttpsUrl(track.files.mp3))
  ));
}
export async function searchTracks(query, { offset = 0, signal, fetcher = fetch } = {}) {
  const sanitized = String(query || "").trim().slice(0, 80);
  if (!sanitized) return { tracks: [], count: 0, offset };
  const url = new URL(API + "/music/tracks/search");
  url.search = new URLSearchParams({
    query: sanitized,
    limit: String(PAGE_SIZE),
    offset: String(offset),
    order: "plays",
    sort: "desc"
  }).toString();
  const response = await fetcher(url.toString(), { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("A consulta ao catálogo falhou (HTTP " + response.status + ").");
  const payload = await response.json();
  if (!payload || !Array.isArray(payload.data)) throw new Error("Resposta inesperada da API musical.");
  return {
    tracks: playableTracks(payload.data),
    count: Number(payload.pagination?.count) || 0,
    offset: offset + PAGE_SIZE
  };
}

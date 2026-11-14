// Requests originate from the deployed site; Vercel forwards them to the public API.
// A rewrite avoids browser CORS restrictions without a serverless function.
export const API_BASE = "/catalog-api";
export const PAGE_SIZE = 18;
export const LICENSED_STREAMING = false;

export function safeHttpsUrl(input) {
  try {
    const u = new URL(input);
    return u.protocol === "https:" ? u.href : "";
  } catch { return ""; }
}
export function artistNames(track) {
  const artists = Array.isArray(track?.artists) ? track.artists : [];
  const names = artists.map(a => Array.isArray(a) ? a[1]?.name : a?.name)
    .filter(n => typeof n === "string" && n.trim());
  return names.length ? names.join(", ") : "Artista não informado";
}
export function playableTracks(tracks) {
  return (Array.isArray(tracks) ? tracks : []).filter(t =>
    typeof t?.id === "string" && typeof t.title === "string" &&
    Boolean(t.title.trim()) && t.is_premium !== true &&
    Boolean(safeHttpsUrl(t.files?.mp3))
  );
}
export function normalizeTracks(items) {
  return (Array.isArray(items) ? items : []).filter(t =>
    typeof t?.id === "string" && typeof t?.title === "string" && Boolean(t.title.trim())
  ).map(t => ({
    id: t.id, source: "remote", title: t.title,
    artist: artistNames(t), artwork: safeHttpsUrl(t.thumbnails?.md || t.thumbnails?.sm || t.thumbnails?.lg),
    duration: Number.isFinite(t.duration) ? t.duration : 0,
    premium: t.is_premium === true
  }));
}
export function normalizeCategories(items) {
  return (Array.isArray(items) ? items : []).filter(c =>
    typeof c?.id === "string" && typeof c?.name === "string" && c.name.trim()
  ).map(c => ({
    id:c.id,name:c.name, type: typeof c.type === "string" ? c.type : "",
    artwork: safeHttpsUrl(c.thumbnails?.md || c.thumbnails?.sm || c.thumbnails?.lg)
  }));
}
async function request(path,params={},fetcher=fetch,signal) {
  const url=new URL(API_BASE+path, "https://foco.local");
  for (const [k,v] of Object.entries(params)) url.searchParams.set(k,String(v));
  const response=await fetcher(url.pathname+url.search,{signal,headers:{Accept:"application/json"}});
  if(!response.ok) throw new Error("Catálogo indisponível (HTTP "+response.status+").");
  const payload=await response.json();
  if(!payload || !Array.isArray(payload.data)) throw new Error("Resposta inválida do catálogo.");
  return payload;
}
export async function getCategories({signal,fetcher=fetch,limit=18}={}) {
  const payload=await request("/music/categories/all",{limit,order:"views",sort:"desc"},fetcher,signal);
  return normalizeCategories(payload.data);
}
export async function getCategoryTracks(id,{signal,fetcher=fetch,offset=0}={}) {
  if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(String(id))) throw new Error("Categoria inválida.");
  const payload=await request("/music/categories/"+encodeURIComponent(id)+"/tracks",
    {limit:PAGE_SIZE,offset,order:"plays",sort:"desc"},fetcher,signal);
  return {tracks:normalizeTracks(payload.data),count:Number(payload.pagination?.count)||0,offset:offset+PAGE_SIZE};
}
export async function searchTracks(query,{signal,fetcher=fetch,offset=0}={}) {
  const term=String(query||"").trim().slice(0,80);
  if(!term) return {tracks:[],count:0,offset};
  const payload=await request("/music/tracks/search",{query:term,limit:PAGE_SIZE,offset,order:"plays",sort:"desc"},fetcher,signal);
  return {tracks:normalizeTracks(payload.data),count:Number(payload.pagination?.count)||0,offset:offset+PAGE_SIZE};
}

// Pure data model: no accounts, no cookies, no server writes.
export const STORAGE_KEY="focodev:playlists:v2";
export const MAX_TRACKS=20;
export const MAX_PLAYLISTS=30;
export const MAX_NAME=48;
export const MAX_SHARE_SIZE=5500;

function text(value,max=80){return String(value??"").trim().slice(0,max);}
export function cleanTrack(track) {
  if(!track || !["local","remote"].includes(track.source) || !text(track.id,80) || !text(track.title,100)) return null;
  return {
    source:track.source,id:text(track.id,80),title:text(track.title,100),
    artist:text(track.artist,80), artwork:text(track.artwork,300),
    duration:Number.isFinite(Number(track.duration)) ? Math.max(0,Math.min(86400,Math.floor(Number(track.duration)))) : 0
  };
}
export function cleanPlaylist(input) {
  if(!input || !Array.isArray(input.tracks)) return null;
  const name=text(input.name,MAX_NAME);
  if(!name) return null;
  const tracks=[],seen=new Set();
  for(const raw of input.tracks.slice(0,MAX_TRACKS)) {
    const t=cleanTrack(raw); if(!t) continue;
    const id=t.source+":"+t.id; if(seen.has(id)) continue;
    tracks.push(t);seen.add(id);
  }
  return {id:text(input.id,100)||"playlist",name,tracks};
}
export function readPlaylists(storage) {
  try {
    const val=JSON.parse(storage.getItem(STORAGE_KEY)||"[]");
    return Array.isArray(val) ? val.slice(0,MAX_PLAYLISTS).map(cleanPlaylist).filter(Boolean) : [];
  } catch { return []; }
}
export function savePlaylists(storage,playlists) {
  storage.setItem(STORAGE_KEY,JSON.stringify(playlists.slice(0,MAX_PLAYLISTS).map(cleanPlaylist).filter(Boolean)));
}
function toB64(bytes) {
  let binary=""; for(const value of bytes) binary+=String.fromCharCode(value);
  return btoa(binary).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function fromB64(str) {
  const b64=str.replace(/-/g,"+").replace(/_/g,"/");
  const binary=atob(b64);
  return Uint8Array.from(binary,ch=>ch.charCodeAt(0));
}
export function encodeShare(playlist) {
  const data=cleanPlaylist(playlist); if(!data) throw new Error("Playlist inválida.");
  const payload={v:1,n:data.name,t:data.tracks.map(x=>[x.source==="local"?"l":"r",x.id,x.title,x.artist,x.artwork,x.duration])};
  const encoded=toB64(new TextEncoder().encode(JSON.stringify(payload)));
  if(encoded.length>MAX_SHARE_SIZE) throw new Error("O link ficou longo. Use até 20 faixas com capas mais curtas.");
  return encoded;
}
export function decodeShare(encoded) {
  if(typeof encoded!=="string" || !/^[a-zA-Z0-9_-]+$/.test(encoded) || encoded.length>MAX_SHARE_SIZE) throw new Error("Link de compartilhamento inválido.");
  let obj;
  try { obj=JSON.parse(new TextDecoder("utf-8",{fatal:true}).decode(fromB64(encoded))); }
  catch { throw new Error("Não foi possível ler a playlist compartilhada."); }
  if(obj?.v!==1 || !Array.isArray(obj.t) || obj.t.length>MAX_TRACKS) throw new Error("Versão de playlist não suportada.");
  const tracks=obj.t.map(row=>Array.isArray(row)?cleanTrack({
    source:row[0]==="l"?"local":row[0]==="r"?"remote":"invalid",
    id:row[1],title:row[2],artist:row[3],artwork:row[4],duration:row[5]
  }):null).filter(Boolean);
  if(tracks.length!==obj.t.length) throw new Error("Faixas inválidas no link.");
  const result=cleanPlaylist({id:"compartilhada",name:obj.n,tracks});
  if(!result) throw new Error("Playlist inválida.");
  return result;
}
export function shareUrl(playlist,baseUrl) {
  const url=new URL(baseUrl);url.hash="p="+encodeShare(playlist);
  return url.toString();
}

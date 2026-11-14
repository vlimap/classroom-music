import test from "node:test";
import assert from "node:assert/strict";
import { encodeShare,decodeShare,cleanPlaylist,shareUrl,readPlaylists,savePlaylists,MAX_TRACKS } from "../src/playlists.js";
const playlist={id:"a",name:"Sessão de estudo",tracks:[{source:"local",id:"noite-de-codigo",title:"Noite de código",artist:"Foco.dev",artwork:"/covers/noite-de-codigo.svg",duration:180}]};
test("playlist é compartilhável por link sem backend",()=>{
 const code=encodeShare(playlist);assert.ok(/^[\w-]+$/.test(code));
 const restored=decodeShare(code);assert.equal(restored.name,playlist.name);assert.equal(restored.tracks[0].id,playlist.tracks[0].id);
 const url=shareUrl(playlist,"https://classroommusic.vercel.app/");
 assert.match(url,/#p=/);
});
test("bloqueia links maliciosos ou grandes",()=>{
 assert.throws(()=>decodeShare("%%%"));
 assert.throws(()=>decodeShare("a".repeat(6000)));
});
test("limita faixas e elimina duplicatas",()=>{
 const item=playlist.tracks[0];const data=cleanPlaylist({...playlist,tracks:Array(30).fill(item)});
 assert.equal(data.tracks.length,1);assert.ok(data.tracks.length<=MAX_TRACKS);
});
test("salva e lê armazenamento local",()=>{
 const map=new Map();
 const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 savePlaylists(storage,[playlist]);
 assert.equal(readPlaylists(storage)[0].name,"Sessão de estudo");
});

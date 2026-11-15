import test from "node:test";
import assert from "node:assert/strict";
import { updateTrackRow } from "../src/track-rows.js";

function createRow(id = "linus-torvalds-linux-e-git") {
  const attrs = new Map();
  const icon = {className: "bi bi-play-fill"};
  const button = {
    title: "",
    setAttribute(name, value) { attrs.set("button:" + name, value); },
    querySelector(selector) { return selector === ".bi" ? icon : null; }
  };
  const author = {hidden:false};
  const status = {hidden:true};
  const listeners = {textContent:"",title:""};
  const parts = {
    ".song-play-toggle": button,
    ".song-author": author,
    ".song-playback-status": status,
    ".song-listeners": listeners
  };
  const row = {
    dataset:{podcastId:id,podcastTitle:"Linus Torvalds, Linux e Git"},
    attrs,
    setAttribute(name,value) { attrs.set(name,value); },
    toggleAttribute(name,yes) { if(yes)attrs.set(name,"");else attrs.delete(name); },
    querySelector(selector) { return parts[selector] ?? null; }
  };
  return { row, attrs, icon, button, author, status, listeners };
}
const config = selected => ({
  selectedId: selected, isPlaying: true,
  stats: {listeners:1}, formatNumber: n => n.toLocaleString("pt-BR")
});

test("música em reprodução usa botão de pausa, sinalização visual e rótulo acessível",()=>{
  const parts = createRow();
  updateTrackRow(parts.row, config("linus-torvalds-linux-e-git"));
  assert.equal(parts.icon.className,"bi bi-pause-fill");
  assert.equal(parts.attrs.get("button:aria-label"),"Pausar Linus Torvalds, Linux e Git");
  assert.equal(parts.attrs.get("button:aria-pressed"),"true");
  assert.equal(parts.row.dataset.playback,"playing");
  assert.equal(parts.attrs.get("aria-current"),"true");
  assert.equal(parts.author.hidden,true);
  assert.equal(parts.status.hidden,false);
  assert.equal(parts.listeners.textContent,"· 1 ouvinte");
});

test("pausa restaura ícone de play e preserva posição ativa na fila",()=>{
  const parts=createRow();
  updateTrackRow(parts.row,config("linus-torvalds-linux-e-git"));
  updateTrackRow(parts.row,{...config("linus-torvalds-linux-e-git"),isPlaying:false});
  assert.equal(parts.icon.className,"bi bi-play-fill");
  assert.equal(parts.attrs.get("button:aria-label"),"Reproduzir Linus Torvalds, Linux e Git");
  assert.equal(parts.row.dataset.playback,"paused");
  assert.equal(parts.status.hidden,true);
  assert.equal(parts.author.hidden,false);
  assert.equal(parts.attrs.get("aria-current"),"true");
});

test("outros podcasts continuam com play e removem o destaque ativo",()=>{
  const parts=createRow();
  updateTrackRow(parts.row,config("javascript-em-10-dias"));
  assert.equal(parts.icon.className,"bi bi-play-fill");
  assert.equal(parts.attrs.has("aria-current"),false);
  assert.equal(parts.row.dataset.playback,"idle");
});

test("contador de ouvintes reflete o Redis imediatamente e sinaliza indisponibilidade",()=>{
  const parts=createRow();
  const base=config("linus-torvalds-linux-e-git");
  updateTrackRow(parts.row,{...base,stats:{listeners:0}});
  assert.equal(parts.listeners.textContent,"· 0 ouvintes");
  updateTrackRow(parts.row,{...base,stats:{listeners:1210}});
  assert.equal(parts.listeners.textContent,"· 1.210 ouvintes");
  updateTrackRow(parts.row,{...base,stats:{listeners:null}});
  assert.equal(parts.listeners.textContent,"· — ouvintes");
});

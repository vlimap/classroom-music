import { CATEGORIES, formatTime, timeDescription, nextIndex, previousIndex, readJsonStorage, saveJsonStorage } from "./music.js";
import { PODCAST_EPISODES, canonicalPodcastId } from "./podcasts.js";
import { createPodcastUI } from "./podcast-ui.js";
import { createSocial } from "./social.js";
import { sortPodcastsByEngagement } from "./ranking.js";
import { filterPodcastEpisodes } from "./search.js";
import { createListeningTracker } from "./listening.js";
import { updateTrackRow } from "./track-rows.js";

const $=id=>document.getElementById(id);
function safeHttpsUrl(value){
  try{const url=new URL(value);return url.protocol==="https:"?url.href:"";}
  catch{return "";}
}
const KEY="focodev:";
const publishedCatalog=[...PODCAST_EPISODES];
const state={
  view:"discover",searchResults:[],
  queue:[],index:0,playing:false,shuffle:false,repeat:"off",
  volume:40,muted:false,expanded:false,playableIds:new Set()
};
let podcastUI=null;
let social=null;
let listeningTracker=null;
const fileAudio=$("file-player");
const currentPosition=()=>fileAudio.currentTime||0;
const currentDuration=()=>Number.isFinite(fileAudio.duration)?fileAudio.duration:0;

function say(message){$("announcer").textContent=message;}
function safeStorage(){try{return window.localStorage;}catch{return null;}}
const storage=safeStorage();
if(storage)state.volume=Math.max(0,Math.min(100,Number(readJsonStorage(KEY+"volume",40))||40));
function icon(name){const i=document.createElement("i");i.className="bi bi-"+name;i.setAttribute("aria-hidden","true");return i;}
function button(text,iconName,handler,cls="button secondary"){
  const b=document.createElement("button");b.type="button";b.className=cls;
  if(iconName)b.append(icon(iconName));
  if(text)b.append(document.createTextNode(text));
  b.addEventListener("click",handler);return b;
}
function image(src,alt="",cls="",fallback="/logo.svg"){
  const img=document.createElement("img");img.className=cls;img.alt=alt;img.loading="lazy";img.decoding="async";
  img.src=src?.startsWith("/covers/")?src:safeHttpsUrl(src)||fallback;
  img.addEventListener("error",()=>{if(!img.src.endsWith(fallback))img.src=fallback;});
  return img;
}
function setView(view,{focus=true}={}){
  const names=["discover","search","podcasts","episode","about","queue"];
  if(!names.includes(view))return;
  state.view=view;
  for(const name of names)$("view-"+name).hidden=name!==view;
  for(const nav of document.querySelectorAll("[data-view]")){
    if(nav.dataset.view===view || (view==="episode" && nav.dataset.view==="podcasts"))
      nav.setAttribute("aria-current","page");
    else nav.removeAttribute("aria-current");
  }
  window.scrollTo({top:0,behavior:"instant"});
  const title=$("view-"+view).querySelector("h1");
  if(focus && title){title.tabIndex=-1;title.focus({preventScroll:true});}
}
function saveSelection(){
  if(!storage)return;
  try{saveJsonStorage(KEY+"volume",state.volume);}catch{}
}

function syncTrackRows() {
  const selectedId=selected()?.id??null;
  for(const row of document.querySelectorAll(".song-row[data-podcast-id]")) {
    updateTrackRow(row,{
      selectedId,
      isPlaying:state.playing,
      stats:social?.snapshot(row.dataset.podcastId),
      formatNumber:value=>social?.formatNumber(value)??String(value)
    });
  }
}

function renderSongs(target,tracks,{mode="catalog"}={}) {
  const container=$(target);
  const fragment=document.createDocumentFragment();
  for(const track of tracks) {
    const row=document.createElement("div");
    row.className="song-row";
    row.dataset.podcastId=track.id;
    row.dataset.podcastTitle=track.title;
    const category=CATEGORIES.find(c=>c.id===track.categoryId);
    row.append(image(track.artwork,"","",category?.artwork||"/logo.svg"));
    const info=document.createElement("div");
    info.className="song-details";
    const name=document.createElement("strong");
    name.textContent=track.title;
    const audioAvailable=state.playableIds.has(canonicalPodcastId(track.id));
    const meta=document.createElement("small");
    meta.className="song-meta";
    const author=document.createElement("span");
    author.className="song-author";
    author.textContent=(track.artist||"Foco.dev")+(audioAvailable?"":" · Áudio em preparação");
    const playbackStatus=document.createElement("span");
    playbackStatus.className="song-playback-status";
    playbackStatus.textContent="Reproduzindo";
    playbackStatus.hidden=true;
    const listeners=document.createElement("span");
    listeners.className="song-listeners";
    meta.append(author,playbackStatus,listeners);
    info.append(name,meta);
    row.append(info);
    const time=document.createElement("span");
    time.className="song-time";
    time.textContent=track.duration>0?formatTime(track.duration):"—";
    row.append(time);
    const actions=document.createElement("div");
    actions.className="song-actions";
    if(audioAvailable){
      const collection=mode==="queue"?state.queue:publishedCatalog;
      const playButton=button("","play-fill",()=>toggleTrackPlayback(track,collection),"song-play-toggle");
      actions.append(playButton);
    }
    if(PODCAST_EPISODES.some(episode=>episode.id===canonicalPodcastId(track.id))){
      const episodeButton=button("","info-circle",()=>void podcastUI?.openEpisode(track.id),"song-info-button");
      episodeButton.setAttribute("aria-label","Ver episódio "+track.title);
      episodeButton.title="Ver episódio";
      actions.append(episodeButton);
    }
    row.append(actions);
    fragment.append(row);
  }
  container.replaceChildren(fragment);
  syncTrackRows();
}

function toggleTrackPlayback(track,collection) {
  if(selected()?.id===canonicalPodcastId(track.id)){
    if(state.playing)pause();
    else void play();
    return;
  }
  playFromTrack(track,collection);
}

function doSearch(value=$("search-query").value){
  const term=value.trim();
  const found=term?sortPodcastsByEngagement(
    filterPodcastEpisodes(publishedCatalog,term), id=>social.snapshot(id)
  ):[];
  state.searchResults=found;
  renderSongs("search-results",found);
  $("search-status").textContent=term
    ?found.length+" episódio(s) encontrado(s) no catálogo de tecnologia."
    :"Digite um título, tema ou palavra-chave para buscar.";
}

function stopFilePlayback(){
  fileAudio.pause();
  fileAudio.removeAttribute("src");
  fileAudio.load();
}
function prepareSelected(){
  stopFilePlayback();
  const track=selected();
  listeningTracker?.reset(track?.id??null);
  if(!track)return false;
  const published=publishedCatalog.find(x=>x.id===canonicalPodcastId(track.id));
  if(!published||!state.playableIds.has(published.id)){
    say("Áudio ainda não publicado.");
    return false;
  }
  fileAudio.src=published.audio;
  fileAudio.load();
  return true;
}
function playFromTrack(track,collection=publishedCatalog){
  const tracks=(Array.isArray(collection)?collection:publishedCatalog)
    .map(t=>publishedCatalog.find(o=>o.id===canonicalPodcastId(t.id)&&state.playableIds.has(o.id)))
    .filter(Boolean);
  const idx=tracks.findIndex(t=>t.id===canonicalPodcastId(track.id));
  if(idx<0){say("A gravação não está disponível para reprodução neste navegador.");return;}
  pause();state.queue=tracks;state.index=idx;state.playing=false;
  if(!prepareSelected())return;
  renderPlayer();renderQueue();
  void play();
}
function selected(){return state.queue[state.index]||null;}
function renderPlayer(){
  const t=selected();
  $("player-title").textContent=t?.title||"Áudios em preparação";
  $("player-artist").textContent=t?.credits||t?.artist||"Foco.dev · vlimap";
  const artwork=$("player-artwork");
  const fallback=CATEGORIES.find(c=>c.id===t?.categoryId)?.artwork||"/logo.svg";
  artwork.onerror=()=>{if(!artwork.src.endsWith(fallback))artwork.src=fallback;};
  artwork.src=t?.artwork||fallback;
  $("play").disabled=!t;
  $("play").hidden=!t;
  $("play").setAttribute("aria-disabled",String(!t));
  $("next").disabled=state.queue.length<2;
  $("previous").disabled=state.queue.length<2;
  $("play").setAttribute("aria-label",state.playing?"Pausar":"Reproduzir");
  $("play").setAttribute("aria-pressed",String(state.playing));
  $("play-icon").className="bi "+(state.playing?"bi-pause-fill":"bi-play-fill");
  $("shuffle").setAttribute("aria-pressed",String(state.shuffle));
  $("shuffle").setAttribute("aria-label",state.shuffle?"Desativar aleatório":"Ativar aleatório");
  $("repeat").setAttribute("aria-pressed",String(state.repeat!=="off"));
  $("repeat").setAttribute("aria-label",state.repeat==="one"?"Repetir faixa":state.repeat==="all"?"Repetir fila":"Repetição desligada");
  $("repeat-icon").className="bi "+(state.repeat==="one"?"bi-repeat-1":"bi-repeat");
  updateTimeline();
  if("mediaSession" in navigator && "MediaMetadata" in window && t){
    try{
      navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:t.artist,album:"Foco.dev",
        artwork:[{src:new URL(t.artwork||"/logo.svg",location.href).href}]});
      navigator.mediaSession.playbackState=state.playing?"playing":"paused";
    }catch{}
  }
  syncTrackRows();
}
function updateTimeline(){
  const length=currentDuration()||0;
  const current=Math.min(length,currentPosition());
  $("elapsed").textContent=formatTime(current);
  $("duration").textContent=formatTime(length);
  if(document.activeElement!==$("seek"))$("seek").value=String(length?Math.floor(current/length*1000):0);
  $("seek").setAttribute("aria-valuetext",timeDescription(current)+" de "+timeDescription(length));
}
async function play(){
  if(!selected())return;
  try{
    if(!fileAudio.src && !prepareSelected())return;
    await fileAudio.play();
    state.playing=true;
    renderPlayer();
  }catch(error){
    state.playing=false;
    renderPlayer();
    say("Não foi possível reproduzir este áudio: "+error.message);
  }
}
function pause(){
  fileAudio.pause();
  state.playing=false;renderPlayer();
}
function advance(ended=false){
  const next=nextIndex(state.index,state.queue.length,state.repeat,state.shuffle);
  if(next<0){pause();if(ended)say("Fim da fila.");return;}
  pause();state.index=next;
  if(!prepareSelected())return;
  state.playing=false;renderPlayer();renderQueue();void play();
}
function previous(){
  if(currentPosition()>3){
    fileAudio.currentTime=0;
    updateTimeline();return;
  }
  pause();state.index=previousIndex(state.index,state.queue.length,state.repeat);
  if(!prepareSelected())return;
  state.playing=false;renderPlayer();renderQueue();void play();
}
function renderQueue(){
  renderSongs("queue-items",state.queue,{mode:"queue"});
}
function setVolume(){
  fileAudio.volume=state.muted?0:state.volume/100;fileAudio.muted=state.muted;
  $("volume").value=String(state.volume);
  $("volume").setAttribute("aria-valuetext",state.volume+" por cento");
  $("mute").setAttribute("aria-pressed",String(state.muted));
  $("mute").setAttribute("aria-label",state.muted?"Ativar som":"Silenciar");
  $("volume-icon").className="bi "+(state.muted||state.volume===0?"bi-volume-mute-fill":state.volume<50?"bi-volume-down-fill":"bi-volume-up-fill");
}

function findVLibrasButton(){
  const official=document.getElementById("vlibras-button")
    ||document.querySelector('[data-testid="vlibras-access-button"]')
    ||document.querySelector('[vw-access-button] .access-button');
  if(official && typeof official.click==="function")return official;
  const exposed=window.VLibrasWidget?.initBtn;
  const button=exposed?.matches?.("button")?exposed:
    exposed?.shadowRoot?.querySelector("button") ||
    exposed?.querySelector?.("button") || exposed;
  return typeof button?.click==="function" ? button : null;
}
function openVLibras(){
  const native=findVLibrasButton();
  if(!native){say("VLibras ainda não está disponível. Verifique a conexão.");return;}
  native.click();
}
function syncVLibrasLauncher(){
  const native=findVLibrasButton();
  if(!native)return false;
  // Apenas o controle visual é ocultado; o tradutor/iframe não é alterado.
  document.documentElement.dataset.vlibrasBranded="true";
  native.setAttribute("aria-hidden","true");
  native.tabIndex=-1;
  // Hide the visual native trigger even when it is inside the VLibras shadow root.
  // Programmatic click remains available through openVLibras().
  native.style?.setProperty("visibility","hidden","important");
  native.style?.setProperty("opacity","0","important");
  native.style?.setProperty("pointer-events","none","important");
  const accessRoot=native.closest?.("#vlibras-access-wrapper, [vw-access-button]");
  if(accessRoot){
    accessRoot.style.setProperty("visibility","hidden","important");
    accessRoot.style.setProperty("pointer-events","none","important");
  }
  $("vlibras-fab").hidden=false;
  return true;
}
function initVLibrasBrand(){
  $("vlibras-fab").addEventListener("click",openVLibras);
  syncVLibrasLauncher();
  const observer=new MutationObserver(()=>syncVLibrasLauncher());
  observer.observe(document.body,{childList:true,subtree:true});
  let checks=0;
  const timer=window.setInterval(()=>{
    checks++;
    syncVLibrasLauncher();
    if(checks>=60){window.clearInterval(timer);observer.disconnect();}
  },350);
}

function initPreferences(){
  const root=document.documentElement;
  const theme=storage?readJsonStorage(KEY+"theme","dark"):"dark";
  if(theme==="light"||theme==="dark")root.dataset.theme=theme;
  if(storage&&readJsonStorage(KEY+"contrast",false))root.dataset.contrast="high";
  if(storage&&readJsonStorage(KEY+"large",false))root.dataset.font="large";
  const sync=()=>{
    const dark=root.dataset.theme==="dark";
    $("theme-toggle").setAttribute("aria-pressed",String(dark));$("theme-toggle").setAttribute("aria-label",dark?"Mudar para tema claro":"Mudar para tema escuro");
    const contrast=root.dataset.contrast==="high";$("contrast-toggle").setAttribute("aria-pressed",String(contrast));$("contrast-toggle").setAttribute("aria-label",contrast?"Desativar alto contraste":"Ativar alto contraste");
    const font=root.dataset.font==="large";$("font-toggle").setAttribute("aria-pressed",String(font));$("font-toggle").setAttribute("aria-label",font?"Voltar ao tamanho de texto padrão":"Ampliar texto");
  };
  $("theme-toggle").addEventListener("click",()=>{
    root.dataset.theme=root.dataset.theme==="dark"?"light":"dark";
    if(storage)saveJsonStorage(KEY+"theme",root.dataset.theme);
    sync();syncVLibrasLauncher();
  });
  $("contrast-toggle").addEventListener("click",()=>{
    root.dataset.contrast=root.dataset.contrast==="high"?"normal":"high";
    if(storage)saveJsonStorage(KEY+"contrast",root.dataset.contrast==="high");
    sync();syncVLibrasLauncher();
  });
  $("font-toggle").addEventListener("click",()=>{
    root.dataset.font=root.dataset.font==="large"?"normal":"large";
    if(storage)saveJsonStorage(KEY+"large",root.dataset.font==="large");
    sync();
  });
  sync();
}
function initNavigation(){
  for(const button of document.querySelectorAll("[data-view]")){
    button.addEventListener("click",()=>{
      const view=button.dataset.view;
      if(view==="podcasts"){podcastUI?.openPodcasts();return;}
      setView(view);
      if(view==="discover")podcastUI?.renderList();
      if(view==="queue")renderQueue();
    });
  }
  $("discover-search-form").addEventListener("submit",event=>{
    event.preventDefault();
    podcastUI?.renderList();
  });
  $("discover-search-query").addEventListener("input",()=>podcastUI?.renderList());
  $("search-form").addEventListener("submit",event=>{event.preventDefault();doSearch();});
  $("search-query").addEventListener("input",event=>{doSearch(event.currentTarget.value);});
}

function initPlayer(){
  setVolume();
  listeningTracker=createListeningTracker({
    audio:fileAudio,
    getEpisodeId:()=>selected()?.id,
    onQualified:id=>social.recordListener(id)
  });
  prepareSelected();
  $("play").addEventListener("click",()=>state.playing?pause():void play());
  $("next").addEventListener("click",()=>advance());
  $("previous").addEventListener("click",previous);
  $("shuffle").addEventListener("click",()=>{state.shuffle=!state.shuffle;renderPlayer();say(state.shuffle?"Ordem aleatória ativada.":"Ordem aleatória desativada.");});
  $("repeat").addEventListener("click",()=>{state.repeat=state.repeat==="off"?"all":state.repeat==="all"?"one":"off";renderPlayer();say("Modo de repetição alterado.");});
  $("mute").addEventListener("click",()=>{state.muted=!state.muted;setVolume();});
  $("volume").addEventListener("input",()=>{state.volume=Number($("volume").value);state.muted=false;setVolume();saveSelection();});
  $("seek").addEventListener("input",()=>{
    const position=currentDuration()*Number($("seek").value)/1000;
    if(Number.isFinite(position))fileAudio.currentTime=position;
    updateTimeline();
  });
  $("expand-player").addEventListener("click",()=>{
    state.expanded=!state.expanded;
    document.body.dataset.expanded=String(state.expanded);
    $("expand-player").setAttribute("aria-expanded",String(state.expanded));
    $("expand-player").setAttribute("aria-label",state.expanded?"Recolher controles":"Mais controles");
    $("expand-icon").className="bi "+(state.expanded?"bi-chevron-down":"bi-sliders");
  });
  if("mediaSession" in navigator){
    try{
      navigator.mediaSession.setActionHandler("play",()=>void play());
      navigator.mediaSession.setActionHandler("pause",pause);
      navigator.mediaSession.setActionHandler("nexttrack",()=>advance());
      navigator.mediaSession.setActionHandler("previoustrack",previous);
      navigator.mediaSession.setActionHandler("seekto",event=>{
        const position=event.seekTime??0;
        fileAudio.currentTime=position;
        updateTimeline();
      });
    }catch{}
  }
  fileAudio.addEventListener("loadedmetadata",updateTimeline);
  fileAudio.addEventListener("timeupdate",updateTimeline);
  fileAudio.addEventListener("seeked",updateTimeline);
  for(const event of ["play","pause"]){
    fileAudio.addEventListener(event,()=>{
      state.playing=!fileAudio.paused&&!fileAudio.ended;
      renderPlayer();
    });
  }
  fileAudio.addEventListener("ended",()=>advance(true));
  fileAudio.addEventListener("error",()=>{
    if(selected()){
      state.playing=false;
      renderPlayer();
      say("Arquivo indisponível. Confirme que o áudio do catálogo foi enviado ao projeto.");
    }
  });
  window.addEventListener("pagehide",stopFilePlayback,{once:true});
  renderPlayer();renderQueue();
}
async function refreshPublishedMedia(){
  const checks=await Promise.all(publishedCatalog.map(async track=>{
    try{
      const response=await fetch(track.audio,{method:"HEAD",cache:"no-store"});
      const contentType=(response.headers.get("content-type")||"").toLowerCase();
      return response.ok&&(contentType.startsWith("audio/")||contentType.includes("octet-stream"))?track.id:null;
    }catch{return null;}
  }));
  state.playableIds=new Set(checks.filter(Boolean));
  if(!state.playing&&state.queue.length===0){
    state.queue=publishedCatalog.filter(track=>state.playableIds.has(track.id));
    state.index=0;
    if(state.queue.length)prepareSelected();
  }
  renderPlayer();podcastUI?.renderList();renderQueue();
  if(state.view==="search"&&state.searchResults.length)renderSongs("search-results",state.searchResults);
  podcastUI?.updateAudioAvailability();
}
function init(){
  social=createSocial({onChange:()=>{
    podcastUI?.updateSocial();
    syncTrackRows();
    if(state.view==="search")doSearch();
  },onError:say});
  podcastUI=createPodcastUI({
    showView:view=>setView(view),
    social,
    announce:say,
    isAvailable:id=>state.playableIds.has(id),
    playEpisode:episode=>playFromTrack(episode,publishedCatalog.filter(track=>state.playableIds.has(track.id))),
  });
  initPreferences();initVLibrasBrand();initNavigation();initPlayer();
  podcastUI.renderList();
  // Links públicos levam ao mesmo player e preservam a experiência de reprodução.
  const initialEpisode=new URLSearchParams(window.location.search).get("episode");
  if(initialEpisode && PODCAST_EPISODES.some(episode=>episode.id===initialEpisode))
    podcastUI.openEpisode(initialEpisode);
  void social.refresh();
  void refreshPublishedMedia();
}

init();

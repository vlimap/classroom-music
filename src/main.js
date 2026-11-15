import { CATEGORIES, formatTime, timeDescription, nextIndex, previousIndex, readJsonStorage, saveJsonStorage } from "./music.js";
import { PODCAST_EPISODES, canonicalPodcastId } from "./podcasts.js";
import { createPodcastUI } from "./podcast-ui.js";
import { createSocial } from "./social.js";
import { filterPodcastEpisodes } from "./search.js";

const $=id=>document.getElementById(id);
function safeHttpsUrl(value){
  try{const url=new URL(value);return url.protocol==="https:"?url.href:"";}
  catch{return "";}
}
const KEY="focodev:";
const publishedCatalog=[...PODCAST_EPISODES];
const state={
  view:"discover",categories:CATEGORIES,
  searchResults:[],searchOffset:0,searchTotal:0,searchTerm:"",
  queue:[],index:0,playing:false,shuffle:false,repeat:"off",
  volume:40,muted:false,expanded:false,request:null,playableIds:new Set()
};
let podcastUI=null;
let social=null;
let listening={id:null,seconds:0,previous:null};
const fileAudio=$("file-player");
const isImported=track=>track?.source==="published";
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

function renderCategories(){
  podcastUI?.renderList();
}
async function fetchCategories(){
  renderCategories();
}
function renderSongs(target,tracks,{mode="catalog"}={}){
  const container=$(target);
  const fragment=document.createDocumentFragment();
  for(const [index,track] of tracks.entries()){
    const row=document.createElement("div");row.className="song-row";
    if(state.queue[state.index]?.id===track.id&&mode==="queue")row.setAttribute("aria-current","true");
    const category=CATEGORIES.find(c=>c.id===track.categoryId);
    row.append(image(track.artwork,"","",category?.artwork||"/logo.svg"));
    const info=document.createElement("div");info.className="song-details";
    const name=document.createElement("strong");name.textContent=track.title;
    const audioAvailable=state.playableIds.has(canonicalPodcastId(track.id));
    const artist=document.createElement("small");
    artist.textContent=(track.artist||"vlimap")+(audioAvailable?"":" · Áudio em preparação");
    info.append(name,artist);row.append(info);
    const time=document.createElement("span");time.className="song-time";
    time.textContent=track.duration>0?formatTime(track.duration):"—";
    row.append(time);
    const actions=document.createElement("div");actions.className="song-actions";
    if(audioAvailable){
      const collection=mode==="queue"?state.queue:publishedCatalog;
      const playButton=button("","play-fill",()=>playFromTrack(track,collection),"");
      playButton.setAttribute("aria-label","Reproduzir "+track.title);
      playButton.title="Reproduzir";
      actions.append(playButton);
    }
    if(PODCAST_EPISODES.some(episode=>episode.id===canonicalPodcastId(track.id))){
      const episodeButton=button("","info-circle",()=>void podcastUI?.openEpisode(track.id),"");
      episodeButton.setAttribute("aria-label","Ver episódio "+track.title);
      episodeButton.title="Ver episódio";
      actions.append(episodeButton);
    }
    row.append(actions);fragment.append(row);
  }
  container.replaceChildren(fragment);
}
async function doSearch(value=$("search-query").value){
  const term=value.trim();
  const found=term?filterPodcastEpisodes(publishedCatalog,term):[];
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
  listening={id:null,seconds:0,previous:null};
  stopFilePlayback();
  const track=selected();
  if(!track)return false;
  if(isImported(track)){
    if(track.source==="published"){
      const published=publishedCatalog.find(x=>x.id===canonicalPodcastId(track.id));
      if(!published||!state.playableIds.has(published.id)){say("Áudio ainda não publicado.");return false;}
      fileAudio.src=published.audio;
    }
    fileAudio.load();
  }
  return true;
}
function playFromTrack(track,collection=publishedCatalog){
  const tracks=(Array.isArray(collection)?collection:publishedCatalog)
    .map(t=>publishedCatalog.find(o=>o.id===canonicalPodcastId(t.id)&&state.playableIds.has(o.id)))
    .filter(Boolean);
  const idx=tracks.findIndex(t=>t.id===canonicalPodcastId(track.id)&&Boolean(isImported(t))===Boolean(isImported(track)));
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
  const tracks=state.queue.map(t=>({...t,source:t.source||"local"}));
  renderSongs("queue-items",tracks,{mode:"queue"});
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
      if(view==="discover")void fetchCategories();
      if(view==="queue")renderQueue();
    });
  }
  $("discover-search-form").addEventListener("submit",event=>{
    event.preventDefault();
    podcastUI?.renderList();
  });
  $("discover-search-query").addEventListener("input",()=>podcastUI?.renderList());
  $("search-form").addEventListener("submit",event=>{event.preventDefault();void doSearch();});
  $("search-query").addEventListener("input",event=>{void doSearch(event.currentTarget.value);});
}
function trackListeningTime(){
  const track=selected();
  if(!track || !social) return;
  if(listening.id!==track.id) listening={id:track.id,seconds:0,previous:null};
  const position=fileAudio.currentTime;
  if(!Number.isFinite(position)) return;
  if(fileAudio.seeking || fileAudio.paused || !state.playing){
    listening.previous=position;
    return;
  }
  if(listening.previous!==null){
    const delta=position-listening.previous;
    // Saltos no seek não representam tempo de áudio efetivamente reproduzido.
    if(delta>0 && delta<=2.5) listening.seconds+=delta;
  }
  listening.previous=position;
  if(listening.seconds>=30) void social.recordListener(track.id);
}
function initPlayer(){
  setVolume();
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
  fileAudio.addEventListener("timeupdate",trackListeningTime);
  fileAudio.addEventListener("seeked",()=>{listening.previous=fileAudio.currentTime;});
  fileAudio.addEventListener("ended",()=>advance(true));
  fileAudio.addEventListener("error",()=>{if(isImported(selected())){state.playing=false;renderPlayer();say("Arquivo indisponível. Confirme que o áudio do catálogo foi enviado ao projeto.");}});
  window.setInterval(()=>{if(state.playing)updateTimeline();},300);
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
  renderPlayer();renderCategories();renderQueue();
  if(state.view==="search"&&state.searchResults.length)renderSongs("search-results",state.searchResults);
  podcastUI?.updateAudioAvailability();
}
function init(){
  social=createSocial({onChange:()=>podcastUI?.updateSocial(),onError:say});
  podcastUI=createPodcastUI({
    showView:view=>setView(view),
    social,
    isAvailable:id=>state.playableIds.has(id),
    playEpisode:episode=>playFromTrack(episode,publishedCatalog.filter(track=>state.playableIds.has(track.id))),
  });
  initPreferences();initVLibrasBrand();initNavigation();initPlayer();
  renderCategories();void fetchCategories();
  void social.refresh();
  void refreshPublishedMedia();
}

init();

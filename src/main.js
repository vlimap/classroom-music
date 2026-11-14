import { ORIGINAL_TRACKS, formatTime, timeDescription, nextIndex, previousIndex, readJsonStorage, saveJsonStorage } from "./music.js";
import { getCategories, getCategoryTracks, searchTracks, LICENSED_STREAMING, PAGE_SIZE, safeHttpsUrl } from "./api.js";
import { cleanPlaylist, readPlaylists, savePlaylists, shareUrl, decodeShare, MAX_PLAYLISTS, MAX_TRACKS } from "./playlists.js";
import { AmbientSynth } from "./audio.js";
import { openAudioDb, listStoredAudio, storeAudioFile, deleteStoredAudio, toPlaylistTrack, MAX_AUDIO_FILES } from "./local-audio.js";

const $=id=>document.getElementById(id);
const KEY="focodev:";
const LOCAL_CATEGORY={id:"original",name:"Ambientes originais",type:"Trilhas Foco.dev",artwork:"/covers/noite-de-codigo.svg",local:true};
const localTracks=ORIGINAL_TRACKS.map(t=>({id:t.id,source:"local",title:t.title,artist:t.artist,artwork:t.artwork,duration:t.duration}));
const allLocal=new Map(localTracks.map(t=>[t.id,t]));
const state={
  view:"discover",categories:[],categoriesExpanded:false,category:null,categoryResults:[],categoryOffset:0,categoryTotal:0,
  searchResults:[],searchOffset:0,searchTotal:0,searchTerm:"",
  playlists:[],activePlaylist:null,shared:null,pending:null,
  queue:[...ORIGINAL_TRACKS],index:0,playing:false,shuffle:false,repeat:"off",
  volume:40,muted:false,expanded:false,request:null,audioFiles:new Map()
};
let categoryLoaded=false;
let nameAction="create";
const synth=new AmbientSynth({onEnded:()=>advance(true)});
const fileAudio=$("file-player");
let audioDb=null;
let fileObjectUrl=null;
const isImported=track=>track?.source==="local-file";
const currentPosition=()=>isImported(selected()) ? fileAudio.currentTime||0 : synth.currentTime;
const currentDuration=()=>isImported(selected()) ? (Number.isFinite(fileAudio.duration)?fileAudio.duration:0) : synth.duration;

function say(message){$("announcer").textContent=message;}
function safeStorage(){try{return window.localStorage;}catch{return null;}}
const storage=safeStorage();
if(storage){state.playlists=readPlaylists(storage);state.volume=Math.max(0,Math.min(100,Number(readJsonStorage(KEY+"volume",40))||40));}
function persist(){try{if(storage) savePlaylists(storage,state.playlists);}catch{say("Sem espaço no navegador. Exporte suas playlists por link.");}}
function icon(name){const i=document.createElement("i");i.className="bi bi-"+name;i.setAttribute("aria-hidden","true");return i;}
function button(text,iconName,handler,cls="button secondary"){
  const b=document.createElement("button");b.type="button";b.className=cls;
  if(iconName)b.append(icon(iconName));
  if(text)b.append(document.createTextNode(text));
  b.addEventListener("click",handler);return b;
}
function image(src,alt="",cls=""){
  const img=document.createElement("img");img.className=cls;img.alt=alt;img.loading="lazy";img.decoding="async";
  const url=src?.startsWith("/covers/")?src:safeHttpsUrl(src);
  img.src=url||"/logo.svg";
  img.addEventListener("error",()=>{if(!img.src.endsWith("/logo.svg"))img.src="/logo.svg";});
  return img;
}
function setView(view,{focus=true}={}){
  const names=["discover","category","search","playlists","playlist","queue","access"];
  if(!names.includes(view))return;
  state.view=view;
  for(const name of names)$("view-"+name).hidden=name!==view;
  for(const nav of document.querySelectorAll("[data-view]")){
    if(nav.dataset.view===view || (view==="category" && nav.dataset.view==="discover") || (view==="playlist" && nav.dataset.view==="playlists"))
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

function card(title,caption,cover,handler,play=false){
  const b=document.createElement("button");b.type="button";b.className="category-card";
  b.append(image(cover,""));
  const info=document.createElement("span");info.className="category-content";
  const labels=document.createElement("span");
  const strong=document.createElement("strong");strong.textContent=title;
  const small=document.createElement("small");small.textContent=caption;
  labels.append(strong,small);info.append(labels,icon(play?"play-circle":"arrow-right"));
  b.append(info);b.setAttribute("aria-label",title+". "+caption);
  b.addEventListener("click",handler);return b;
}
function renderCategories(){
  const container=$("category-grid");const fragment=document.createDocumentFragment();
  fragment.append(card(LOCAL_CATEGORY.name,"4 faixas · reprodução liberada",LOCAL_CATEGORY.artwork,()=>openCategory(LOCAL_CATEGORY),true));
  if(state.audioFiles.size){
    const personal={id:"personal",name:"Meus arquivos",type:"Áudio deste navegador",artwork:"/logo.svg",local:true};
    fragment.append(card(personal.name,state.audioFiles.size+" músicas locais",personal.artwork,()=>openCategory(personal),true));
  }
  const items=state.categoriesExpanded ? state.categories : state.categories.slice(0,11);
  for(const c of items)fragment.append(card(c.name,c.type||"Catálogo FreeToUse",c.artwork,()=>openCategory(c)));
  container.replaceChildren(fragment);
  const more=$("show-categories");
  more.hidden=state.categories.length<=11;
  more.lastChild.textContent=state.categoriesExpanded?" Mostrar menos categorias":" Mostrar todas as categorias ("+state.categories.length+")";
  more.setAttribute("aria-expanded",String(state.categoriesExpanded));
}
async function fetchCategories({force=false}={}){
  if(categoryLoaded&&!force)return;
  if(!force && storage){
    try{
      const cached=JSON.parse(storage.getItem(KEY+"category-cache-v2")||"null");
      if(cached?.saved && Date.now()-cached.saved<1800000 && Array.isArray(cached.data)){
        state.categories=cached.data;categoryLoaded=true;renderCategories();
        $("category-status").textContent=state.categories.length+" categorias disponíveis (cache local).";
        return;
      }
    }catch{}
  }
  $("category-status").textContent="Carregando categorias...";
  $("reload-categories").disabled=true;
  renderCategories(); // fallback original always available
  if(state.request?.type==="categories")state.request.controller.abort();
  const controller=new AbortController();state.request={type:"categories",controller};
  try{
    const categories=await getCategories({signal:controller.signal,limit:100});
    if(controller.signal.aborted)return;
    state.categories=categories;
    categoryLoaded=true;
    if(storage){try{storage.setItem(KEY+"category-cache",JSON.stringify({saved:Date.now(),data:categories}));}catch{}}
    renderCategories();
    $("category-status").textContent=categories.length?categories.length+" categorias disponíveis no catálogo.":"Nenhuma categoria retornada pela API.";
  }catch(error){
    if(controller.signal.aborted)return;
    $("category-status").textContent="Não foi possível carregar as categorias ("+(error.message||"erro de rede")+"). Você ainda pode ouvir os ambientes originais. Use Atualizar para tentar novamente.";
  }finally{$("reload-categories").disabled=false;}
}
function renderSongs(target,tracks,{mode="catalog",label=""}={}){
  const container=$(target);
  const fragment=document.createDocumentFragment();
  for(const [index,track] of tracks.entries()){
    const row=document.createElement("div");row.className="song-row";
    if(state.queue[state.index]?.id===track.id && mode==="queue")row.setAttribute("aria-current","true");
    row.append(image(track.artwork));
    const info=document.createElement("div");info.className="song-details";
    const name=document.createElement("strong");name.textContent=track.title;
    const artist=document.createElement("small");artist.textContent=track.artist||"Artista não informado";
    info.append(name,artist);row.append(info);
    const time=document.createElement("span");time.className="song-time";time.textContent=formatTime(track.duration);row.append(time);
    const actions=document.createElement("div");actions.className="song-actions";
    const local=track.source==="local" || (isImported(track) && state.audioFiles.has(track.id));
    if(local){
      const collection=mode==="playlist"||mode==="shared" ? currentPlaylist()?.tracks :
        mode==="queue" ? state.queue : mode==="imported" ? [...state.audioFiles.values()].map(toPlaylistTrack) :
        state.category?.id==="personal" ? [...state.audioFiles.values()].map(toPlaylistTrack) : localTracks;
      const play=button("","play-fill",()=>playFromTrack(track,collection),"");
      play.setAttribute("aria-label","Reproduzir "+track.title);play.title="Reproduzir";
      actions.append(play);
    }
    if(mode==="playlist"){
      const remove=button("","x-lg",()=>removeTrack(index),"");
      remove.setAttribute("aria-label","Remover "+track.title+" da playlist");remove.title="Remover faixa";
      actions.append(remove);
    }else if(mode!=="queue" && mode!=="shared"){
      if(mode==="imported"){
        const removeFile=button("","trash3",()=>void removeAudioFile(track.id),"");
        removeFile.setAttribute("aria-label","Excluir arquivo "+track.title+" deste navegador");
        removeFile.title="Excluir arquivo local";
        actions.append(removeFile);
      }
      const add=button("","plus-circle",()=>addTrackDialog(track),"");
      add.setAttribute("aria-label","Adicionar "+track.title+" a uma playlist");add.title="Adicionar à playlist";
      actions.append(add);
    }
    if(!local && mode!=="queue"){
      const label=document.createElement("span");label.className="sr-only";
      label.textContent=isImported(track)?"Arquivo de áudio não disponível neste navegador.":"Faixa externa disponível para organização, sem reprodução neste aplicativo.";
      row.append(label);
    }
    row.append(actions);fragment.append(row);
  }
  container.replaceChildren(fragment);
}
async function openCategory(category){
  state.category=category;
  $("category-title").textContent=category.name;
  $("category-type").textContent=category.id==="personal"?"Arquivos pessoais":category.local?"Áudio original":"Catálogo FreeToUse";
  $("category-desc").textContent=category.id==="personal"
    ?"Áudio armazenado somente neste navegador; nenhum arquivo é enviado ao servidor."
    :category.local?"Faixas instrumentais originais prontas para ouvir e incluir nas suas playlists."
    :"Explore as músicas, veja as capas e organize sua biblioteca. Reprodução externa exige licença.";
  state.categoryResults=[];state.categoryOffset=0;state.categoryTotal=0;
  renderSongs("category-tracks",[]);
  $("category-more").hidden=true;
  setView("category");
  if(category.local){
    state.categoryResults=category.id==="personal" ? [...state.audioFiles.values()].map(toPlaylistTrack) : [...localTracks];
    renderSongs("category-tracks",state.categoryResults);
    $("category-tracks-status").textContent=state.categoryResults.length+" faixas disponíveis para reprodução neste navegador.";
    return;
  }
  await loadCategoryTracks();
}
async function loadCategoryTracks(){
  if(!state.category || state.category.local)return;
  if(state.request?.type==="tracks")state.request.controller.abort();
  const controller=new AbortController();state.request={type:"tracks",controller};
  $("category-tracks-status").textContent="Consultando músicas...";
  $("category-more").hidden=true;
  try{
    const data=await getCategoryTracks(state.category.id,{offset:state.categoryOffset,signal:controller.signal});
    if(controller.signal.aborted)return;
    const known=new Set(state.categoryResults.map(t=>t.id));
    state.categoryResults.push(...data.tracks.filter(t=>!known.has(t.id)));
    state.categoryOffset=data.offset;state.categoryTotal=data.count;
    renderSongs("category-tracks",state.categoryResults);
    $("category-tracks-status").textContent=state.categoryResults.length+" faixas encontradas.";
    $("category-more").hidden=state.categoryOffset>=state.categoryTotal;
  }catch(error){
    if(!controller.signal.aborted)$("category-tracks-status").textContent="Falha ao consultar categoria: "+error.message;
  }
}
async function doSearch({more=false}={}){
  const term=$("search-query").value.trim().slice(0,80);
  if(!term)return;
  if(state.request?.type==="search")state.request.controller.abort();
  const controller=new AbortController();state.request={type:"search",controller};
  if(!more || term!==state.searchTerm){
    state.searchTerm=term;state.searchResults=[];state.searchOffset=0;state.searchTotal=0;
    renderSongs("search-results",[]);
  }
  $("search-status").textContent="Buscando músicas...";
  $("search-more").hidden=true;
  try{
    const data=await searchTracks(term,{offset:state.searchOffset,signal:controller.signal});
    if(controller.signal.aborted)return;
    const known=new Set(state.searchResults.map(t=>t.id));
    state.searchResults.push(...data.tracks.filter(t=>!known.has(t.id)));
    state.searchOffset=data.offset;state.searchTotal=data.count;
    renderSongs("search-results",state.searchResults);
    $("search-status").textContent=state.searchResults.length+" faixas encontradas para “"+term+"”.";
    $("search-more").hidden=state.searchOffset>=state.searchTotal;
  }catch(error){
    if(!controller.signal.aborted)$("search-status").textContent="Falha na busca: "+error.message+". Verifique a rota da API ou tente novamente.";
  }
}

function renderImportedAudio(){
  const tracks=[...state.audioFiles.values()].map(toPlaylistTrack);
  renderSongs("local-audio-list",tracks,{mode:"imported"});
  $("local-audio-status").textContent=tracks.length
    ?tracks.length+" músicas guardadas neste navegador. Não serão compartilhadas ao criar um link."
    :"Nenhum arquivo importado. Selecione seus arquivos MP3, OGG ou outros formatos de áudio.";
  renderCategories();
}
async function initAudioLibrary(){
  try{
    audioDb=await openAudioDb();
    const records=await listStoredAudio(audioDb);
    state.audioFiles=new Map(records.map(record=>[record.id,record]));
    renderImportedAudio();
  }catch(error){
    $("local-audio-status").textContent="Não foi possível acessar a biblioteca local: "+error.message;
  }
}
async function importAudioSelection(files){
  if(!audioDb){say("A biblioteca local não está disponível neste navegador.");return;}
  const list=Array.from(files||[]);
  if(!list.length)return;
  let imported=0;
  const errors=[];
  for(const file of list){
    try{
      const record=await storeAudioFile(audioDb,file,[...state.audioFiles.values()]);
      state.audioFiles.set(record.id,record);
      imported++;
    }catch(error){errors.push(file.name+": "+error.message);}
  }
  renderImportedAudio();
  say(imported+" arquivos importados. "+(errors.length?errors.join(" "):""));
  if(errors.length)$("local-audio-status").textContent+= " Alguns arquivos não foram importados: "+errors.join(" ");
}
async function removeAudioFile(id){
  const record=state.audioFiles.get(id);
  if(!record||!audioDb)return;
  if(!window.confirm("Excluir o arquivo “"+record.title+"” deste navegador e removê-lo das playlists locais?"))return;
  try{
    await deleteStoredAudio(audioDb,id);
    state.audioFiles.delete(id);
    for(const playlist of state.playlists)
      playlist.tracks=playlist.tracks.filter(track=>!(track.source==="local-file"&&track.id===id));
    persist();
    if(selected()?.id===id){
      pause();
      state.queue=[...ORIGINAL_TRACKS];state.index=0;prepareSelected();renderPlayer();renderQueue();
    }
    renderImportedAudio();
    listPlaylists();
    if(state.view==="playlist")openPlaylist(state.activePlaylist);
    if(state.view==="category"&&state.category?.id==="personal")void openCategory(state.category);
    say("Arquivo removido deste navegador.");
  }catch(error){say("Falha ao excluir arquivo: "+error.message);}
}
function initAudioImport(){
  $("import-audio").addEventListener("click",()=>$("audio-picker").click());
  $("audio-picker").addEventListener("change",event=>{
    void importAudioSelection(event.target.files);
    event.target.value="";
  });
}

function currentPlaylist(){return state.playlists.find(p=>p.id===state.activePlaylist) || (state.shared?.id===state.activePlaylist?state.shared:null);}
function listPlaylists(){
  const grid=$("playlist-grid");const fragment=document.createDocumentFragment();
  for(const p of state.playlists){
    const picture=p.tracks.find(t=>t.artwork)?.artwork||"/logo.svg";
    fragment.append(card(p.name,p.tracks.length+" faixas",picture,()=>openPlaylist(p.id)));
  }
  grid.replaceChildren(fragment);
  $("playlists-empty").hidden=state.playlists.length>0;
}
function openPlaylist(id){
  state.activePlaylist=id;
  const playlist=currentPlaylist();
  if(!playlist){setView("playlists");return;}
  $("playlist-title").textContent=playlist.name;
  $("playlist-count").textContent=playlist.tracks.length+" faixas · "+(playlist.id==="compartilhada"?"Compartilhada por link":"Salva neste dispositivo");
  $("playlist-empty").hidden=playlist.tracks.length>0;
  $("rename-playlist").hidden=playlist.id==="compartilhada";
  $("delete-playlist").hidden=playlist.id==="compartilhada";
  renderSongs("playlist-songs",playlist.tracks,{mode:playlist.id==="compartilhada"?"shared":"playlist"});
  setView("playlist");
}
function uniqueId(){return globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+"-"+Math.random().toString(36).slice(2);}
function showNameDialog(mode="create"){
  if(mode==="create" && state.playlists.length>=MAX_PLAYLISTS){say("Limite de "+MAX_PLAYLISTS+" playlists atingido.");return;}
  nameAction=mode;
  $("name-dialog-title").textContent=mode==="rename"?"Renomear playlist":"Criar playlist";
  $("playlist-name").value=mode==="rename"?currentPlaylist()?.name||"":"";
  $("name-dialog").showModal();
  $("playlist-name").focus();
}
function createPlaylist(name){
  const playlist={id:uniqueId(),name,tracks:[]};
  if(state.pending && playlist.tracks.length<MAX_TRACKS)playlist.tracks.push(state.pending);
  state.playlists.unshift(playlist);
  persist();listPlaylists();state.pending=null;openPlaylist(playlist.id);
  say("Playlist criada.");
}
function addTrackDialog(track){
  state.pending=track;
  if(!state.playlists.length){showNameDialog();return;}
  $("add-song-name").textContent=track.title;
  const select=$("playlist-select");
  select.replaceChildren();
  for(const p of state.playlists){
    const option=document.createElement("option");option.value=p.id;option.textContent=p.name;select.append(option);
  }
  $("add-dialog").showModal();
  select.focus();
}
function addToPlaylist(track,playlistId){
  const p=state.playlists.find(x=>x.id===playlistId);
  if(!p || !track)return;
  if(p.tracks.length>=MAX_TRACKS){say("Limite de "+MAX_TRACKS+" músicas por playlist.");return;}
  if(p.tracks.some(t=>t.id===track.id && t.source===track.source)){say("Essa faixa já está na playlist.");return;}
  p.tracks.push(track);persist();
  if(state.view==="playlist"&&state.activePlaylist===p.id)openPlaylist(p.id);
  say("Música adicionada à playlist "+p.name+".");
}
function removeTrack(index){
  const p=currentPlaylist();if(!p)return;
  if(p.id==="compartilhada"){say("Salve uma cópia da playlist antes de editar.");return;}
  if(!p.tracks[index])return;
  p.tracks.splice(index,1);persist();openPlaylist(p.id);
  say("Música removida.");
}
function deleteCurrent(){
  const p=currentPlaylist();if(!p || p.id==="compartilhada")return;
  if(!window.confirm("Excluir a playlist “"+p.name+"” deste dispositivo?"))return;
  state.playlists=state.playlists.filter(x=>x.id!==p.id);
  persist();listPlaylists();setView("playlists");say("Playlist excluída.");
}
async function openShare(){
  const p=currentPlaylist();if(!p)return;
  try{
    $("share-link").value=shareUrl(p,location.href);
    $("share-dialog").showModal();$("share-link").focus();
  }catch(error){say(error.message);}
}
async function copyShare(){
  const val=$("share-link").value;
  try{await navigator.clipboard.writeText(val);say("Link copiado. Você pode compartilhar com os colegas.");}
  catch{$("share-link").select();say("Selecione e copie o link manualmente.");}
}
function readSharedLink(){
  const hash=location.hash;
  if(!hash.startsWith("#p="))return;
  try{
    state.shared=decodeShare(hash.slice(3));
    $("shared-banner").hidden=false;
    $("shared-message").textContent="Playlist compartilhada: "+state.shared.name+".";
    state.activePlaylist=state.shared.id;
    openPlaylist("compartilhada");
  }catch(error){say(error.message);}
}
function saveShared(){
  if(!state.shared)return;
  if(state.playlists.length>=MAX_PLAYLISTS){say("Limite de playlists atingido.");return;}
  const p={...state.shared,id:uniqueId(),tracks:[...state.shared.tracks]};
  state.playlists.unshift(p);persist();listPlaylists();
  $("shared-banner").hidden=true;state.shared=null;
  history.replaceState(null,"",location.pathname+location.search);
  openPlaylist(p.id);say("Cópia salva neste navegador.");
}

function stopFilePlayback(){
  fileAudio.pause();
  fileAudio.removeAttribute("src");
  fileAudio.load();
  if(fileObjectUrl){URL.revokeObjectURL(fileObjectUrl);fileObjectUrl=null;}
}
function prepareSelected(){
  synth.pause();
  stopFilePlayback();
  const track=selected();
  if(!track)return false;
  if(isImported(track)){
    const record=state.audioFiles.get(track.id);
    if(!record){say("Este arquivo não está disponível neste navegador.");return false;}
    fileObjectUrl=URL.createObjectURL(record.blob);
    fileAudio.src=fileObjectUrl;
    fileAudio.load();
  }else synth.load(track);
  return true;
}
function playFromTrack(track,collection=localTracks){
  const tracks=(Array.isArray(collection)?collection:localTracks).map(t=>{
    if(isImported(t))return state.audioFiles.has(t.id)?toPlaylistTrack(state.audioFiles.get(t.id)):null;
    return t.source==="local"||allLocal.has(t.id)?ORIGINAL_TRACKS.find(o=>o.id===t.id):null;
  }).filter(Boolean);
  const idx=tracks.findIndex(t=>t.id===track.id&&Boolean(isImported(t))===Boolean(isImported(track)));
  if(idx<0){say("A gravação não está disponível para reprodução neste navegador.");return;}
  pause();state.queue=tracks;state.index=idx;state.playing=false;
  if(!prepareSelected())return;
  renderPlayer();renderQueue();
  void play();
}
function selected(){return state.queue[state.index]||null;}
function renderPlayer(){
  const t=selected();
  $("player-title").textContent=t?.title||"Selecione uma música";
  $("player-artist").textContent=t?.artist||"Foco.dev";
  $("player-artwork").src=t?.artwork||"/logo.svg";
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
    if(isImported(selected())){
      if(!fileAudio.src && !prepareSelected())return;
      await fileAudio.play();
    }else await synth.play();
    state.playing=true;
    renderPlayer();
  }catch(error){
    state.playing=false;
    renderPlayer();
    say("Não foi possível reproduzir este áudio: "+error.message);
  }
}
function pause(){
  synth.pause();
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
    if(isImported(selected()))fileAudio.currentTime=0;
    else synth.seek(0);
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
  synth.setVolume(state.volume/100);synth.setMuted(state.muted);
  fileAudio.volume=state.muted?0:state.volume/100;fileAudio.muted=state.muted;
  $("volume").value=String(state.volume);
  $("volume").setAttribute("aria-valuetext",state.volume+" por cento");
  $("mute").setAttribute("aria-pressed",String(state.muted));
  $("mute").setAttribute("aria-label",state.muted?"Ativar som":"Silenciar");
  $("volume-icon").className="bi "+(state.muted||state.volume===0?"bi-volume-mute-fill":state.volume<50?"bi-volume-down-fill":"bi-volume-up-fill");
}

function styleVLibrasButton(){
  // API oficial: initBtn expõe o botão para ajustes de estilo.
  const native=window.VLibrasWidget?.initBtn;
  if(!native)return false;
  const highContrast=document.documentElement.dataset.contrast==="high";
  const color=highContrast ? (document.documentElement.dataset.theme==="light"?"#000000":"#ffffff") : "#315d49";
  const border=highContrast ? (document.documentElement.dataset.theme==="light"?"#000000":"#ffffff") : "#d7b98a";
  const paint=element=>{
    if(!element?.style)return;
    element.style.setProperty("background",color,"important");
    element.style.setProperty("background-color",color,"important");
    element.style.setProperty("border","2px solid "+border,"important");
    element.style.setProperty("border-radius","12px","important");
  };
  paint(native);
  // Algumas versões renderizam o controle numa shadow root.
  const shadowButton=native.shadowRoot?.querySelector("button");
  if(shadowButton)paint(shadowButton);
  native.title="VLibras — tradução em Libras";
  return true;
}
function initVLibrasBrand(){
  if(styleVLibrasButton())return;
  let attempts=0;
  const timer=window.setInterval(()=>{
    attempts++;
    if(styleVLibrasButton()||attempts>=80)window.clearInterval(timer);
  },250);
}

function initPreferences(){
  const root=document.documentElement;
  const theme=storage?readJsonStorage(KEY+"theme","dark"):"dark";
  if(theme==="light"||theme==="dark")root.dataset.theme=theme;
  if(storage&&readJsonStorage(KEY+"contrast",false))root.dataset.contrast="high";
  if(storage&&readJsonStorage(KEY+"large",false))root.dataset.font="large";
  const sync=()=>{
    const dark=root.dataset.theme==="dark";
    $("theme-toggle").setAttribute("aria-pressed",String(dark));$("theme-state").textContent=dark?"Escuro":"Claro";
    const contrast=root.dataset.contrast==="high";$("contrast-toggle").setAttribute("aria-pressed",String(contrast));$("contrast-state").textContent=contrast?"Ligado":"Desligado";
    const font=root.dataset.font==="large";$("font-toggle").setAttribute("aria-pressed",String(font));$("font-state").textContent=font?"Ampliado":"Padrão";
  };
  $("theme-toggle").addEventListener("click",()=>{
    root.dataset.theme=root.dataset.theme==="dark"?"light":"dark";
    if(storage)saveJsonStorage(KEY+"theme",root.dataset.theme);
    sync();styleVLibrasButton();
  });
  $("contrast-toggle").addEventListener("click",()=>{
    root.dataset.contrast=root.dataset.contrast==="high"?"normal":"high";
    if(storage)saveJsonStorage(KEY+"contrast",root.dataset.contrast==="high");
    sync();styleVLibrasButton();
  });
  $("font-toggle").addEventListener("click",()=>{
    root.dataset.font=root.dataset.font==="large"?"normal":"large";
    if(storage)saveJsonStorage(KEY+"large",root.dataset.font==="large");
    sync();
  });
  sync();
  $("vlibras-trigger").addEventListener("click",()=>{
    const control=window.VLibrasWidget?.initBtn;
    if(typeof control?.click==="function")control.click();
    else say("VLibras ainda não carregou. Verifique sua conexão.");
  });
}
function initNavigation(){
  for(const b of document.querySelectorAll("[data-view]")){
    b.addEventListener("click",()=>{
      const v=b.dataset.view;setView(v);
      if(v==="discover")void fetchCategories();
      if(v==="playlists")listPlaylists();
      if(v==="queue")renderQueue();
    });
  }
  $("reload-categories").addEventListener("click",()=>void fetchCategories({force:true}));
  $("show-categories").addEventListener("click",()=>{
    state.categoriesExpanded=!state.categoriesExpanded;
    renderCategories();
    say(state.categoriesExpanded?"Todas as categorias exibidas.":"Exibindo as categorias mais populares.");
  });
  $("back-categories").addEventListener("click",()=>setView("discover"));
  $("back-playlists").addEventListener("click",()=>{listPlaylists();setView("playlists");});
  $("category-more").addEventListener("click",()=>void loadCategoryTracks());
  $("search-form").addEventListener("submit",e=>{e.preventDefault();void doSearch();});
  $("search-more").addEventListener("click",()=>void doSearch({more:true}));
}
function initPlaylists(){
  $("create-top").addEventListener("click",()=>{state.pending=null;showNameDialog();});
  $("create-in-library").addEventListener("click",()=>{state.pending=null;showNameDialog();});
  $("cancel-name").addEventListener("click",()=>{$("name-dialog").close();state.pending=null;});
  $("name-form").addEventListener("submit",e=>{
    e.preventDefault();
    const name=$("playlist-name").value.trim().slice(0,48);
    if(!name)return;
    $("name-dialog").close();
    if(nameAction==="rename"){
      const p=currentPlaylist();if(!p||p.id==="compartilhada")return;
      p.name=name;persist();openPlaylist(p.id);say("Playlist renomeada.");
    }else createPlaylist(name);
  });
  $("cancel-add").addEventListener("click",()=>{$("add-dialog").close();state.pending=null;});
  $("add-form").addEventListener("submit",e=>{
    e.preventDefault();addToPlaylist(state.pending,$("playlist-select").value);
    $("add-dialog").close();state.pending=null;
  });
  $("share-playlist").addEventListener("click",()=>void openShare());
  $("close-share").addEventListener("click",()=>$("share-dialog").close());
  $("copy-share").addEventListener("click",()=>void copyShare());
  $("save-shared").addEventListener("click",saveShared);
  $("delete-playlist").addEventListener("click",deleteCurrent);
  $("rename-playlist").addEventListener("click",()=>showNameDialog("rename"));
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
    if(isImported(selected())){if(Number.isFinite(position))fileAudio.currentTime=position;}
    else synth.seek(position);
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
        if(isImported(selected()))fileAudio.currentTime=position;else synth.seek(position);
        updateTimeline();
      });
    }catch{}
  }
  fileAudio.addEventListener("loadedmetadata",updateTimeline);
  fileAudio.addEventListener("ended",()=>{if(isImported(selected()))advance(true);});
  fileAudio.addEventListener("error",()=>{if(isImported(selected())){state.playing=false;renderPlayer();say("Não foi possível ler este arquivo de áudio.");}});
  window.setInterval(()=>{if(state.playing)updateTimeline();},300);
  window.addEventListener("pagehide",()=>{stopFilePlayback();synth.dispose();audioDb?.close();},{once:true});
  renderPlayer();renderQueue();
}
function init(){
  initPreferences();initVLibrasBrand();initNavigation();initPlaylists();initAudioImport();initPlayer();
  void initAudioLibrary();
  listPlaylists();renderCategories();void fetchCategories();
  readSharedLink();
  window.addEventListener("hashchange",readSharedLink);
}
init();

import { ORIGINAL_TRACKS, formatTime, timeDescription, nextIndex, previousIndex, readJsonStorage, saveJsonStorage } from "./music.js";
import { searchTracks, artistNames, safeHttpsUrl, LICENSED_STREAMING, PAGE_SIZE } from "./api.js";
import { AmbientSynth } from "./audio.js";

const el = (id) => document.getElementById(id);
const view = {
  originalList: el("original-list"), catalogList: el("catalog-list"), catalogStatus: el("catalog-status"),
  catalogLicense: el("catalog-license"), queue: el("queue-list"), search: el("search-form"),
  query: el("search-input"), more: el("load-more"), announcer: el("announcer"),
  play: el("play-button"), playIcon: el("play-icon"), pauseIcon: el("pause-icon"),
  previous: el("previous-button"), next: el("next-button"), shuffle: el("shuffle-button"),
  repeat: el("repeat-button"), repeatOne: el("repeat-one"), seek: el("seek"),
  elapsed: el("current-time"), duration: el("total-time"), volume: el("volume"),
  mute: el("mute-button"), favorite: el("favorite-button"), cover: el("playing-cover"),
  title: el("playing-title"), artist: el("playing-artist"), audio: el("remote-audio")
};
const KEY = "focodev:";
const savedVolume = Number(readJsonStorage(KEY + "volume", 40));
let volume = Number.isFinite(savedVolume) ? Math.max(0, Math.min(100, savedVolume)) : 40;
let muted = false;
let source = "original";
let queue = [...ORIGINAL_TRACKS];
let currentIndex = 0;
let playing = false;
let repeat = "off";
let shuffle = false;
let catalog = [];
let searchOffset = 0;
let searchCount = 0;
let searchQuery = "lofi";
let activeRequest = null;
let catalogLoaded = false;
const favorites = new Set(Array.isArray(readJsonStorage(KEY + "favorites", [])) ? readJsonStorage(KEY + "favorites", []) : []);
const synth = new AmbientSynth({ onEnded: () => { if (source === "original") advance(true); } });

function announce(message) { view.announcer.textContent = message; }
function selected() { return queue[currentIndex] || null; }
function currentDuration() { return source === "original" ? synth.duration : (Number.isFinite(view.audio.duration) ? view.audio.duration : selected()?.duration || 0); }
function currentTime() { return source === "original" ? synth.currentTime : (view.audio.currentTime || 0); }
function isFavorite(id) { return favorites.has(id); }
function saveFavorites() { saveJsonStorage(KEY + "favorites", [...favorites]); }
function trackArtist(track) { return source === "original" ? track.artist : artistNames(track); }

function makeRow(track, index, kind) {
  const isLocal = kind === "original";
  const row = document.createElement(isLocal || LICENSED_STREAMING ? "button" : "div");
  row.className = "track-row";
  if (row.tagName === "BUTTON") {
    row.type = "button";
    row.setAttribute("aria-label", "Reproduzir " + track.title + ", " + (isLocal ? track.artist : artistNames(track)));
    row.addEventListener("click", () => selectTrack(index, kind, true));
  } else { row.setAttribute("role", "group"); }
  if (selected()?.id === track.id && source === kind) row.setAttribute("aria-current", "true");
  const artwork = isLocal ? document.createElement("span") : document.createElement("img");
  artwork.className = "track-cover" + (isLocal ? " local" : "");
  if (isLocal) {
    artwork.textContent = "∿";
    artwork.setAttribute("aria-hidden", "true");
  } else {
    artwork.src = safeHttpsUrl(track.thumbnails?.sm || track.thumbnails?.md) || "/logo.svg";
    artwork.alt = "";
    artwork.loading = "lazy";
  }
  const detail = document.createElement("span");
  detail.className = "track-details";
  const name = document.createElement("span"); name.className = "track-name"; name.textContent = track.title;
  const artist = document.createElement("span"); artist.className = "track-subtitle";
  artist.textContent = isLocal ? track.artist : artistNames(track);
  detail.append(name, artist);
  const duration = document.createElement("span"); duration.className = "track-duration";
  duration.textContent = formatTime(track.duration);
  row.append(artwork, detail, duration);
  return row;
}
function renderList(container, tracks, kind) {
  const focusedId = document.activeElement?.closest?.(".track-row")?.dataset?.trackId;
  const fragment = document.createDocumentFragment();
  tracks.forEach((track, index) => {
    const row = makeRow(track, index, kind);
    row.dataset.trackId = track.id;
    fragment.append(row);
  });
  container.replaceChildren(fragment);
  if (focusedId && container.contains(document.activeElement) === false) {
    const replacement = [...container.children].find((child) => child.dataset.trackId === focusedId);
    if (replacement?.tagName === "BUTTON") replacement.focus({ preventScroll: true });
  }
}
function renderQueue() {
  const fragment = document.createDocumentFragment();
  queue.forEach((track, index) => {
    const item = document.createElement("li");
    if (currentIndex === index) item.setAttribute("aria-current", "true");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = track.title;
    button.setAttribute("aria-label", "Selecionar " + track.title);
    button.addEventListener("click", () => selectTrack(index, source, true));
    item.append(button);
    fragment.append(item);
  });
  view.queue.replaceChildren(fragment);
}
function updatePlayer() {
  const track = selected();
  view.title.textContent = track?.title || "Selecione uma faixa";
  view.artist.textContent = track ? trackArtist(track) : "Foco.dev";
  view.cover.src = source === "original" ? "/logo.svg" : (safeHttpsUrl(track?.thumbnails?.md) || "/logo.svg");
  view.favorite.disabled = !track;
  view.favorite.setAttribute("aria-pressed", String(Boolean(track && isFavorite(track.id))));
  view.favorite.setAttribute("aria-label", track && isFavorite(track.id) ? "Remover dos favoritos" : "Adicionar aos favoritos");
  view.play.setAttribute("aria-label", playing ? "Pausar" : "Reproduzir");
  view.play.setAttribute("aria-pressed", String(playing));
  view.play.title = playing ? "Pausar" : "Reproduzir";
  view.playIcon.hidden = playing;
  view.pauseIcon.hidden = !playing;
  updateTimeline();
  updateMediaSession();
}
function updateTimeline() {
  const duration = currentDuration();
  const position = Math.min(duration, currentTime());
  const value = duration > 0 ? Math.round(position / duration * 1000) : 0;
  if (document.activeElement !== view.seek) view.seek.value = String(value);
  view.seek.setAttribute("aria-valuetext", timeDescription(position) + " de " + timeDescription(duration));
  view.elapsed.textContent = formatTime(position);
  view.duration.textContent = formatTime(duration);
}
function updateMediaSession() {
  if (!("mediaSession" in navigator) || !("MediaMetadata" in window) || !selected()) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: selected().title, artist: trackArtist(selected()), album: "Foco.dev",
    artwork: [{ src: new URL(view.cover.getAttribute("src"), location.href).href, sizes: "128x128", type: "image/svg+xml" }]
  });
  navigator.mediaSession.playbackState = playing ? "playing" : "paused";
}
function setPlayerVolume() {
  const value = muted ? 0 : volume / 100;
  view.audio.volume = value;
  synth.setVolume(value);
  synth.setMuted(muted);
  view.volume.value = String(volume);
  view.volume.setAttribute("aria-valuetext", volume + " por cento");
  view.mute.setAttribute("aria-pressed", String(muted));
  view.mute.setAttribute("aria-label", muted ? "Ativar som" : "Silenciar");
}
async function play() {
  if (!selected()) return;
  try {
    if (source === "original") await synth.play();
    else {
      if (!LICENSED_STREAMING) { announce("A reprodução deste catálogo exige autorização de uso."); return; }
      await view.audio.play();
    }
    playing = true;
    updatePlayer();
  } catch (error) {
    playing = false;
    updatePlayer();
    announce("Não foi possível iniciar o áudio. " + (error?.message || "Interação bloqueada pelo navegador."));
  }
}
function pause() {
  if (source === "original") synth.pause();
  else view.audio.pause();
  playing = false;
  updatePlayer();
}
function selectTrack(index, kind = "original", autoplay = false) {
  const collection = kind === "original" ? [...ORIGINAL_TRACKS] : catalog;
  if (!collection[index] || (kind === "remote" && !LICENSED_STREAMING)) return;
  synth.pause();
  view.audio.pause();
  source = kind;
  queue = collection;
  currentIndex = index;
  if (kind === "original") {
    view.audio.removeAttribute("src");
    synth.load(queue[index]);
  } else {
    view.audio.src = safeHttpsUrl(queue[index].files.mp3);
    view.audio.load();
  }
  playing = false;
  renderQueue();
  renderList(view.originalList, ORIGINAL_TRACKS, "original");
  renderList(view.catalogList, catalog, "remote");
  updatePlayer();
  announce("Faixa selecionada: " + selected().title);
  if (autoplay) void play();
}
function advance(ended = false) {
  const next = nextIndex(currentIndex, queue.length, repeat, shuffle);
  if (next === -1) {
    pause();
    if (ended) announce("A fila terminou. Escolha outra faixa ou ative repetição.");
    return;
  }
  selectTrack(next, source, true);
}
function previous() {
  if (currentTime() > 3) {
    seekTo(0);
    return;
  }
  const index = previousIndex(currentIndex, queue.length, repeat);
  if (index !== -1) selectTrack(index, source, true);
}
function seekTo(seconds) {
  if (!selected()) return;
  if (source === "original") synth.seek(seconds);
  else {
    try { view.audio.currentTime = seconds; } catch { /* mídia ainda não pode buscar */ }
  }
  updateTimeline();
}
function toggleFavorite() {
  const id = selected()?.id;
  if (!id) return;
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  saveFavorites();
  updatePlayer();
  announce(favorites.has(id) ? "Faixa adicionada aos favoritos." : "Faixa removida dos favoritos.");
}
function selectTab(tab) {
  const original = tab === "original";
  el("tab-original").setAttribute("aria-selected", String(original));
  el("tab-library").setAttribute("aria-selected", String(!original));
  el("tab-original").tabIndex = original ? 0 : -1;
  el("tab-library").tabIndex = original ? -1 : 0;
  el("panel-original").hidden = !original;
  el("panel-library").hidden = original;
  if (!original && !catalogLoaded) void fetchCatalog(false);
}
function initTabs() {
  const tabs = [el("tab-original"), el("tab-library")];
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(index === 0 ? "original" : "library"));
    tab.addEventListener("keydown", (event) => {
      const next = event.key === "ArrowRight" ? (index + 1) % 2 : event.key === "ArrowLeft" ? (index + 1) % 2 : event.key === "Home" ? 0 : event.key === "End" ? 1 : null;
      if (next === null) return;
      event.preventDefault();
      selectTab(next === 0 ? "original" : "library");
      tabs[next].focus();
    });
  });
}
async function fetchCatalog(more) {
  if (activeRequest) activeRequest.abort();
  activeRequest = new AbortController();
  const signal = activeRequest.signal;
  searchQuery = view.query.value.trim() || "lofi";
  if (!more) { searchOffset = 0; searchCount = 0; catalog = []; renderList(view.catalogList, [], "remote"); }
  view.catalogStatus.textContent = "Buscando músicas...";
  view.more.disabled = true;
  view.more.hidden = true;
  try {
    const data = await searchTracks(searchQuery, { offset: searchOffset, signal });
    if (signal.aborted) return;
    const ids = new Set(catalog.map((track) => track.id));
    catalog.push(...data.tracks.filter((track) => !ids.has(track.id)));
    searchOffset = data.offset;
    searchCount = data.count;
    catalogLoaded = true;
    renderList(view.catalogList, catalog, "remote");
    view.catalogStatus.textContent = catalog.length ? catalog.length + " faixas encontradas. Busca: " + searchQuery + "." : "Nenhuma faixa disponível para esta pesquisa.";
    view.more.hidden = searchOffset >= searchCount;
    view.more.disabled = false;
  } catch (error) {
    if (signal.aborted) return;
    view.catalogStatus.textContent = "Não foi possível consultar a API. Verifique conexão, disponibilidade do serviço e permissões CORS.";
    view.more.hidden = true;
    console.warn("Consulta ao catálogo falhou:", error);
  } finally {
    if (!signal.aborted) activeRequest = null;
  }
}
function initPreferences() {
  const root = document.documentElement;
  const theme = readJsonStorage(KEY + "theme", "auto");
  if (theme === "dark" || theme === "light") root.dataset.theme = theme;
  const contrast = readJsonStorage(KEY + "contrast", false) === true;
  const large = readJsonStorage(KEY + "large", false) === true;
  if (contrast) root.dataset.contrast = "high";
  if (large) root.dataset.font = "large";
  const effectiveDark = () => root.dataset.theme === "dark" || (!root.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);
  const themeButton = el("theme-toggle"), contrastButton = el("contrast-toggle"), fontButton = el("font-toggle");
  function reflectTheme() {
    const dark = effectiveDark();
    themeButton.setAttribute("aria-pressed", String(dark));
    themeButton.setAttribute("aria-label", dark ? "Ativar modo claro" : "Ativar modo escuro");
    themeButton.textContent = dark ? "Modo escuro" : "Modo claro";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#151a18" : "#f6f4ed");
  }
  reflectTheme();
  contrastButton.setAttribute("aria-pressed", String(contrast));
  fontButton.setAttribute("aria-pressed", String(large));
  themeButton.addEventListener("click", () => {
    root.dataset.theme = effectiveDark() ? "light" : "dark";
    saveJsonStorage(KEY + "theme", root.dataset.theme);
    reflectTheme();
    announce("Tema alterado.");
  });
  contrastButton.addEventListener("click", () => {
    const enabled = root.dataset.contrast !== "high";
    if (enabled) root.dataset.contrast = "high"; else delete root.dataset.contrast;
    saveJsonStorage(KEY + "contrast", enabled);
    contrastButton.setAttribute("aria-pressed", String(enabled));
    announce(enabled ? "Alto contraste ativado." : "Alto contraste desativado.");
  });
  fontButton.addEventListener("click", () => {
    const enabled = root.dataset.font !== "large";
    if (enabled) root.dataset.font = "large"; else delete root.dataset.font;
    saveJsonStorage(KEY + "large", enabled);
    fontButton.setAttribute("aria-pressed", String(enabled));
    announce(enabled ? "Texto ampliado." : "Tamanho do texto padrão.");
  });
}
function initAccessibility() {
  el("vlibras-trigger").addEventListener("click", () => {
    const button = window.VLibrasWidget?.initBtn;
    if (button && typeof button.click === "function") button.click();
    else announce("O VLibras ainda não está disponível. Verifique sua conexão e utilize o botão oficial quando aparecer.");
  });
}
function initControls() {
  view.play.addEventListener("click", () => playing ? pause() : void play());
  view.previous.addEventListener("click", previous);
  view.next.addEventListener("click", () => advance(false));
  view.favorite.addEventListener("click", toggleFavorite);
  view.shuffle.addEventListener("click", () => {
    shuffle = !shuffle;
    view.shuffle.setAttribute("aria-pressed", String(shuffle));
    view.shuffle.setAttribute("aria-label", shuffle ? "Desativar ordem aleatória" : "Ativar ordem aleatória");
    announce(shuffle ? "Ordem aleatória ativada." : "Ordem aleatória desativada.");
  });
  view.repeat.addEventListener("click", () => {
    repeat = repeat === "off" ? "all" : repeat === "all" ? "one" : "off";
    const label = repeat === "off" ? "Repetição desligada" : repeat === "all" ? "Repetir fila" : "Repetir faixa";
    view.repeat.setAttribute("aria-label", label);
    view.repeat.setAttribute("aria-pressed", String(repeat !== "off"));
    view.repeatOne.hidden = repeat !== "one";
    announce(label + ".");
  });
  view.seek.addEventListener("input", () => {
    seekTo(currentDuration() * Number(view.seek.value) / 1000);
  });
  view.volume.addEventListener("input", () => {
    volume = Number(view.volume.value);
    muted = false;
    setPlayerVolume();
    saveJsonStorage(KEY + "volume", volume);
  });
  view.mute.addEventListener("click", () => {
    muted = !muted;
    setPlayerVolume();
    announce(muted ? "Som silenciado." : "Som ativado.");
  });
  view.audio.addEventListener("ended", () => { if (source === "remote") advance(true); });
  view.audio.addEventListener("error", () => { if (source === "remote") { playing = false; updatePlayer(); announce("Não foi possível carregar esta faixa."); } });
  view.audio.addEventListener("loadedmetadata", updateTimeline);
  view.search.addEventListener("submit", (event) => { event.preventDefault(); void fetchCatalog(false); });
  view.more.addEventListener("click", () => void fetchCatalog(true));
  if ("mediaSession" in navigator) {
    try {
      navigator.mediaSession.setActionHandler("play", () => void play());
      navigator.mediaSession.setActionHandler("pause", pause);
      navigator.mediaSession.setActionHandler("previoustrack", previous);
      navigator.mediaSession.setActionHandler("nexttrack", () => advance(false));
      navigator.mediaSession.setActionHandler("seekto", (details) => seekTo(details.seekTime || 0));
    } catch { /* controles do sistema indisponíveis */ }
  }
  window.setInterval(() => { if (playing) updateTimeline(); }, 250);
  window.addEventListener("pagehide", () => synth.dispose(), { once: true });
}
function init() {
  initPreferences();
  initAccessibility();
  initTabs();
  initControls();
  setPlayerVolume();
  view.catalogLicense.hidden = LICENSED_STREAMING;
  selectTrack(0, "original", false);
  announce("Player pronto. Pressione Reproduzir para iniciar.");
}
init();

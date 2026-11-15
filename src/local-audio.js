// Arquivos de áudio com autorização de uso são armazenados APENAS no navegador.
// Não há upload, proxy, cópias em Vercel nem download de catálogos externos.
export const AUDIO_DB_NAME = "focodev:audio-files";
export const AUDIO_STORE = "tracks";
export const MAX_AUDIO_FILES = 40;
export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_LIBRARY_BYTES = 250 * 1024 * 1024;

const AUDIO_EXT = /\.(mp3|m4a|aac|ogg|opus|wav|webm|flac)$/i;

export function validateAudioFile(file) {
  const name = typeof file?.name === "string" ? file.name.trim() : "";
  const size = Number(file?.size);
  if (!name || !AUDIO_EXT.test(name)) throw new Error("Aceitamos MP3, M4A, AAC, OGG, OPUS, WAV, WebM e FLAC.");
  if (!Number.isFinite(size) || size <= 0 || size > MAX_FILE_BYTES) {
    throw new Error("Cada episódio precisa ter até 25 MB e não pode estar vazio.");
  }
  if (file.type && !file.type.startsWith("audio/") && file.type !== "application/ogg") {
    throw new Error("O arquivo selecionado não é identificado como áudio.");
  }
  return name.replace(AUDIO_EXT, "").slice(0, 100).trim() || "Meu episódio";
}

export function openAudioDb(factory = globalThis.indexedDB) {
  if (!factory) return Promise.reject(new Error("O navegador não oferece armazenamento local de áudio."));
  return new Promise((resolve, reject) => {
    const request = factory.open(AUDIO_DB_NAME, 1);
    request.onerror = () => reject(request.error || new Error("Não foi possível abrir a biblioteca."));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(AUDIO_STORE)) db.createObjectStore(AUDIO_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
  });
}

function transactionWrite(db, command) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(AUDIO_STORE, "readwrite");
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error || new Error("Falha ao armazenar áudio."));
    transaction.onabort = () => reject(transaction.error || new Error("Armazenamento interrompido."));
    command(transaction.objectStore(AUDIO_STORE));
  });
}

export function listStoredAudio(db) {
  return new Promise((resolve, reject) => {
    const request = db.transaction(AUDIO_STORE, "readonly").objectStore(AUDIO_STORE).getAll();
    request.onerror = () => reject(request.error || new Error("Falha ao ler biblioteca local."));
    request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
  });
}

export async function storeAudioFile(db, file, currentRecords) {
  const title = validateAudioFile(file);
  if (currentRecords.length >= MAX_AUDIO_FILES) throw new Error("Limite de 40 arquivos locais atingido.");
  const used = currentRecords.reduce((n, r) => n + (Number(r.blob?.size) || 0), 0);
  if (used + file.size > MAX_LIBRARY_BYTES) throw new Error("A biblioteca local está limitada a 250 MB.");
  const entry = {
    id: globalThis.crypto?.randomUUID?.() ?? `audio-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title, artist: "Arquivo deste dispositivo", duration: 0,
    artwork: "/logo.svg", source: "local-file", blob: file,
    filename: file.name, createdAt: Date.now()
  };
  await transactionWrite(db, store => store.put(entry));
  return entry;
}

export function deleteStoredAudio(db, id) {
  return transactionWrite(db, store => store.delete(id));
}

export function toPlaylistTrack(entry) {
  return {
    id: entry.id, title: entry.title, source: "local-file",
    artwork: "/logo.svg", artist: entry.artist, duration: entry.duration || 0
  };
}

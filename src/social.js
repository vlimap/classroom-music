const ID_KEY = "focodev:social:visitor";
const LIKE_PREFIX = "focodev:social:liked:";
const LISTEN_PREFIX = "focodev:social:listened:";
const formatNumber = new Intl.NumberFormat("pt-BR");

function browserStorage() {
  try { return window.localStorage; } catch { return null; }
}
function visitorId(storage) {
  if (!storage || !globalThis.crypto?.randomUUID) return null;
  try {
    const saved = storage.getItem(ID_KEY);
    if (saved && /^[0-9a-f-]{36}$/i.test(saved)) return saved;
    const id = crypto.randomUUID();
    storage.setItem(ID_KEY, id);
    return id;
  } catch { return null; }
}
export function createSocial({onChange = () => {}, onError = () => {}} = {}) {
  const storage = browserStorage();
  const visitor = visitorId(storage);
  const counts = new Map();
  const pending = new Set();
  const retryAt = new Map();
  let available = false;

  const wasLiked = id => {
    try { return storage?.getItem(LIKE_PREFIX + id) === "1"; }
    catch { return false; }
  };
  const wasCounted = id => {
    try { return storage?.getItem(LISTEN_PREFIX + id) === "1"; }
    catch { return false; }
  };
  const mark = (key, value) => {
    try { storage?.setItem(key, value); } catch {}
  };
  const snapshot = id => {
    const totals = counts.get(id);
    return {
      available: available && Boolean(visitor) && Boolean(totals),
      likes: totals?.likes ?? null,
      listeners: totals?.listeners ?? null,
      liked: wasLiked(id),
      pending: pending.has("like:" + id)
    };
  };
  async function refresh() {
    try {
      const response = await fetch("/api/social", {cache: "no-store"});
      if (!response.ok) throw new Error("Métricas indisponíveis");
      const data = await response.json();
      if (!data.stats || typeof data.stats !== "object") throw new Error("Resposta inválida");
      counts.clear();
      for (const [id, stats] of Object.entries(data.stats)) {
        if (Number.isSafeInteger(stats?.likes) && Number.isSafeInteger(stats?.listeners) &&
            stats.likes >= 0 && stats.listeners >= 0) counts.set(id, stats);
      }
      available = true;
    } catch {
      available = false;
      counts.clear();
    }
    onChange();
  }
  async function send(action, id) {
    const response = await fetch("/api/social", {
      method: "POST",
      headers: {"content-type": "application/json"},
      body: JSON.stringify({id, action, visitorId: visitor}),
      cache: "no-store"
    });
    if (!response.ok) throw new Error("Falha ao registrar interação");
    const data = await response.json();
    if (data.id !== id || !Number.isSafeInteger(data.count) || data.count < 0)
      throw new Error("Resposta de métricas inválida");
    return data;
  }
  async function toggleLike(id) {
    const key = "like:" + id;
    if (!snapshot(id).available || pending.has(key)) return;
    pending.add(key);
    onChange();
    const action = wasLiked(id) ? "unlike" : "like";
    try {
      const result = await send(action, id);
      const totals = counts.get(id);
      if (totals) totals.likes = result.count;
      mark(LIKE_PREFIX + id, action === "like" ? "1" : "0");
    } catch {
      onError("Não foi possível registrar a curtida. Tente novamente.");
    } finally {
      pending.delete(key);
      onChange();
    }
  }
  async function recordListener(id) {
    if (!visitor) return false;
    if (wasCounted(id)) return true;
    const key = "listen:" + id;
    if (pending.has(key) || Date.now() < (retryAt.get(id) || 0)) return false;
    pending.add(key);
    try {
      const result = await send("listen", id);
      const totals = counts.get(id);
      if (totals) totals.listeners = result.count;
      mark(LISTEN_PREFIX + id, "1");
      retryAt.delete(id);
      onChange();
      return true;
    } catch {
      retryAt.set(id, Date.now() + 30000);
      onError("Não foi possível contabilizar esta audição. O sistema tentará novamente.");
      return false;
    } finally {
      pending.delete(key);
    }
  }
  return { snapshot, refresh, toggleLike, recordListener, formatNumber: value => formatNumber.format(value) };
}

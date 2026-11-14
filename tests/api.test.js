import test from "node:test";
import assert from "node:assert/strict";
import { artistNames, safeHttpsUrl, playableTracks, searchTracks, LICENSED_STREAMING } from "../src/api.js";

const track = (id) => ({
  id, title: "Soft Coding", artists: [[1, { id: "artist1", name: "Someone" }]],
  is_premium: false, duration: 120, files: { mp3: "https://cdn.example.org/audio.mp3" }
});

test("integração de MP3 não é liberada sem licença", () => {
  assert.equal(LICENSED_STREAMING, false);
});
test("artistas seguem o formato de pares da API", () => {
  assert.equal(artistNames(track("1")), "Someone");
  assert.equal(artistNames({ artists: [] }), "Artista não informado");
});
test("URLs aceitam exclusivamente HTTPS", () => {
  assert.equal(safeHttpsUrl("http://example.org/a.mp3"), "");
  assert.equal(safeHttpsUrl("javascript:alert(1)"), "");
  assert.equal(safeHttpsUrl("https://example.org/a.mp3"), "https://example.org/a.mp3");
});
test("filtra faixas premium ou sem áudio seguro", () => {
  const premium = { ...track("2"), is_premium: true };
  const broken = { ...track("3"), files: { mp3: "javascript:alert(1)" } };
  assert.deepEqual(playableTracks([track("1"), premium, broken]).map((t) => t.id), ["1"]);
});
test("consulta busca sem chave com paginação e ordem", async () => {
  let requestUrl = "";
  const result = await searchTracks("lofi", {
    fetcher: async (url) => {
      requestUrl = url;
      return { ok: true, json: async () => ({ data: [track("1")], pagination: { count: 1 } }) };
    }
  });
  assert.equal(result.tracks.length, 1);
  assert.equal(result.count, 1);
  assert.equal(result.offset, 24);
  assert.equal(new URL(requestUrl).searchParams.get("query"), "lofi");
});
test("rejeita estrutura inesperada da resposta", async () => {
  await assert.rejects(
    searchTracks("lofi", { fetcher: async () => ({ ok: true, json: async () => ({ data: null }) }) }),
    /Resposta inesperada/
  );
});

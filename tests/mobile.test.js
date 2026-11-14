import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { ORIGINAL_TRACKS } from "../src/music.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(resolve(root, "index.html"), "utf8");
const css = readFileSync(resolve(root, "src/styles/app.css"), "utf8");
const main = readFileSync(resolve(root, "src/main.js"), "utf8");

test("as quatro trilhas originais têm capas individuais e válidas em SVG", () => {
  const paths = new Set();
  for (const track of ORIGINAL_TRACKS) {
    assert.ok(track.artwork.startsWith("/covers/"), track.id);
    assert.equal(paths.has(track.artwork), false);
    paths.add(track.artwork);
    const file = resolve(root, "." + track.artwork);
    assert.ok(existsSync(file), file);
    const svg = readFileSync(file, "utf8");
    assert.match(svg, /<svg\b/);
    assert.match(svg, /<title\b/);
    assert.match(svg, /viewBox="0 0 512 512"/);
    assert.ok(svg.includes(track.title), track.title);
  }
});

test("Bootstrap Icons com versão fixada e controles acessíveis", () => {
  assert.match(html, /bootstrap-icons@1\.13\.2/);
  for (const icon of ["bi-house-door-fill", "bi-music-note-list", "bi-search", "bi-list-ol", "bi-universal-access", "bi-play-fill", "bi-pause-fill"]) {
    assert.ok(html.includes(icon), icon);
  }
  for (const id of ["play-button", "next-button", "favorite-button", "player-expand", "volume"]) {
    assert.ok(html.includes('id="' + id + '"'), id);
  }
});

test("barra inferior móvel com destinos identificados e mini-player expansível", () => {
  assert.match(html, /aria-label="Navegação inferior"/);
  for (const target of ["home", "tracks", "explore", "queue", "access"]) {
    assert.ok(html.includes('data-nav-target="' + target + '"'), target);
  }
  assert.match(html, /aria-expanded="false"/);
  assert.match(main, /function initMobileNavigation\(\)/);
  assert.match(main, /function initMobilePlayer\(\)/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /\.mobile-nav/);
});

test("cada resultado da API usa sua própria arte e fallback seguro", () => {
  assert.match(main, /function coverFor\(/);
  assert.match(main, /track\.thumbnails/);
  assert.match(main, /safeHttpsUrl\(/);
  assert.match(main, /setCover\(artwork, coverFor\(track, kind, "sm"\)\)/);
  assert.match(main, /setCover\(view\.cover, coverFor\(track, source, "md"\)\)/);
});

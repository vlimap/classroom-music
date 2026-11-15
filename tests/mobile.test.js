import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve,dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const load=path=>readFileSync(resolve(root,path),"utf8");
const html=load("index.html"),css=load("src/styles/app.css"),main=load("src/main.js");
test("o catálogo visual usa a identidade de podcasts",()=>{
 assert.match(html,/Podcasts de tecnologia/);
 assert.match(html,/src="\/logo\.svg"/);
});
test("navegação mobile: ícones, rótulos e safe-area",()=>{
 assert.match(html,/aria-label="Navegação inferior"/);
 for(const v of ["discover","queue","about"])
  assert.ok(html.includes('data-view="'+v+'"'),v);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(html,/bootstrap-icons@1\.13\.2/);
});
test("player, podcasts e fila intactos",()=>{
 for(const id of ["discover-podcast-grid","file-player","queue-items"])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(main,/published\.audio/);
 for(const id of ["view-podcasts","view-episode","episode-sources"])
  assert.ok(html.includes('id="'+id+'"'),id);
});
test("sem consultas a FreeToUse na interface",()=>{
 assert.doesNotMatch(main,/getCategories|getCategoryTracks|searchTracks|api\.freetouse/);
});

test("barra inferior ocupa toda a largura com uma coluna por destino",()=>{
 const nav=html.match(/<nav class="mobile-nav"[^>]*>([\s\S]*?)<\/nav>/);
 assert.ok(nav,"navegação mobile presente");
 const destinations=[...nav[1].matchAll(/<button\b[^>]*data-view=/g)];
 assert.equal(destinations.length,3,"três destinos no menu inferior");
 const columns=[...css.matchAll(/\.mobile-nav\{[^}]*grid-template-columns:repeat\((\d+),minmax\(0,1fr\)\)/g)];
 assert.ok(columns.length>0,"grid responsivo definido para a barra inferior");
 for(const [,count] of columns)
  assert.equal(Number(count),destinations.length,"cada breakpoint deve distribuir igualmente os destinos");
});

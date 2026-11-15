# SEO, compartilhamento social e GEO — Foco.dev

## URLs canônicas e prévias

- Site: https://classroommusic.vercel.app/
- Episódios: `https://classroommusic.vercel.app/podcasts/<id>`
- Sitemap de episódios e imagens: https://classroommusic.vercel.app/sitemap.xml
- Feed RSS dos áudios publicados: https://classroommusic.vercel.app/feed.xml
- Robots: https://classroommusic.vercel.app/robots.txt

A Vercel reescreve `/podcasts/:slug` para `/api/episode?slug=:slug` **sem mudar o URL exibido**. A função retorna HTML completo com título, descrição, imagem, resumo e links antes de executar JavaScript, permitindo que crawlers sociais e buscadores leiam os metadados diretamente.

Ações de compartilhamento nos cards e na tela de detalhes usam o endereço canônico do episódio. No celular, a Web Share API abre a interface nativa; sem suporte, o link é copiado (ou apresentado para cópia manual). O usuário que seleciona “Ouvir episódio” é direcionado ao player já aberto no episódio correto.

## Metadados e dados estruturados

- `<title>` e descrição únicos por episódio, canonical absoluta e `robots=index,follow,max-image-preview:large`.
- Open Graph (título, tipo, URL, imagem JPEG, descrição e localidade) e Twitter/X Summary Large Image. As imagens sociais horizontais em `covers/social/` são derivadas das capas originais em `covers/podcasts/`, com resolução 1200×630, mantendo a arte editorial. A rotina `scripts/generate_social_covers.py` é executada pelo GitHub Actions quando capas são alteradas.
- JSON-LD `WebSite`, `Organization`, `PodcastSeries`, `PodcastEpisode`, `AudioObject` e `BreadcrumbList`. `duration` é extraída do catálogo, com áudio M4A já versionado.
- A página principal inclui links HTML rastreáveis para os sete episódios, mesmo que o navegador não execute JavaScript.
- O sitemap é derivado automaticamente do catálogo; não inclui `lastmod` fabricado.
- O RSS 2.0 possui `enclosure` com tamanho de arquivo verificado pelos testes. Ainda **não é um feed garantidamente aceito por diretórios comerciais**: falta registrar datas reais de publicação e outras exigências de cada plataforma.

**Não confundir datas:** `1995`, `1969`, `1988` etc. são anos dos **acontecimentos históricos**, não datas de publicação dos podcasts. Por isso não há `datePublished` ou `pubDate` fictícios.

**GEO (otimização para mecanismos generativos)** significa fornecer conteúdo original, legível, rastreável, com estrutura semântica e identificação editorial consistente. Não são usados textos artificiais, citações inexistentes, `FAQPage` promocional, palavras-chave excessivas ou `llms.txt` sem finalidade comprovada. O Google não requer marcação especial para AI Overviews/AI Mode.

## Validação

No Windows 11:

```powershell
npm run check
npm test
npm run dev
```

Exemplos locais:

- http://127.0.0.1:4173/podcasts/javascript-em-10-dias
- http://127.0.0.1:4173/sitemap.xml
- http://127.0.0.1:4173/feed.xml

Após o deployment de produção, conferir `HTTP 200` e a presença das tags `og:image` e `canonical` no **HTML recebido** (não apenas no DOM renderizado) para pelo menos dois episódios distintos. Conferir se cada imagem social retorna `200`, `image/jpeg` e dimensões 1200×630.

Em Windows PowerShell:

```powershell
(Invoke-WebRequest -Uri "https://classroommusic.vercel.app/podcasts/javascript-em-10-dias").Content |
  Select-String -Pattern 'og:image|og:title|application/ld\+json|canonical'
```

Validar em serviços externos:

- Meta Sharing Debugger: https://developers.facebook.com/tools/debug/
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
- Rich Results Test: https://search.google.com/test/rich-results
- Schema.org Validator: https://validator.schema.org/
- Google Search Console: https://search.google.com/search-console
- Bing Webmaster Tools: https://www.bing.com/webmasters/

É necessário **verificar a propriedade** do domínio no Search Console antes de enviar o sitemap e acompanhar o relatório de indexação. Submeter `https://classroommusic.vercel.app/sitemap.xml` em *Sitemaps*. Não há garantia de indexação, ranking, rich results, aparição em mecanismos generativos ou geração de prévias por todas as redes.

## Melhorias editoriais futuras

- Confirmar e registrar a data efetiva de lançamento de cada episódio; somente então adicionar `datePublished`, `pubDate` e campos de distribuidoras de podcast.
- Publicar transcrições revisadas dos áudios, com trechos verificáveis e fontes jornalísticas efetivamente utilizadas na produção. Não publicar transcrições inventadas.
- Conferir as prévias JPEG (1200×630) em WhatsApp, Facebook, LinkedIn e X usando os validadores oficiais. Depois de alterar uma capa, verificar a execução da workflow de geração das imagens sociais e solicitar atualização do cache dos provedores, se necessário.
- Adicionar novos episódios em `src/podcasts.js` e atualizar o manifesto de tamanhos `AUDIO_FILE_BYTES` se houver novo áudio. Testes de CI impedem divergências entre o manifesto e os arquivos.

## Referências oficiais

- SEO em JavaScript: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Guia Google para recursos de IA: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Sitemap: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Dados estruturados: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Open Graph: https://ogp.me/
- Rewrites Vercel: https://vercel.com/docs/routing/rewrites

# Handoff do Foco.dev

O projeto foi reposicionado para um catálogo exclusivamente de podcasts sobre tecnologia. Não há integração com catálogo musical externo e não há renderização automática de áudio no repositório.

## Arquivos principais

- `src/podcasts.js`: os episódios, seus créditos e nomes esperados dos áudios.
- `src/podcast-ui.js`: cards, fontes editoriais e estado “em produção”.
- `src/main.js`: busca, player HTMLAudioElement, fila e navegação.
- `audio/podcasts/`: destino dos áudios finais.

## Métricas sociais

- Cards compactos com coração e ouvintes; totais reais dependem da configuração de Redis no Vercel.
- `src/social.js` e `api/social.js` tratam curtidas e ouvintes anônimos. Ver `docs/SOCIAL_METRICS.md`.

## Próximo passo editorial

Os sete áudios M4A já estão versionados em `audio/podcasts/`. Conferir locução, duração, MIME, reprodução e fonte de cada episódio, além de registrar as datas reais de publicação e referências verificáveis antes de adicioná-las à página ou ao feed.

## Descoberta e compartilhamento

- Permalinks `/podcasts/:slug` renderizados por `api/episode.js` na Vercel.
- `/sitemap.xml` e `/feed.xml` gerados automaticamente; manter o arquivo `AUDIO_FILE_BYTES` atualizado para novos áudios.
- `src/share.js` abre o compartilhamento nativo/copia URLs canônicas; `/?episode=id` volta ao player.
- Consulte `docs/SEO_GEO.md` para validações de indexação e de card social.

## Validação

```bash
npm run check
npm test
```

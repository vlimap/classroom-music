# Foco.dev

Catálogo acessível de podcasts sobre tecnologia, com player, fila e cards compactos de estilo editorial. Os cards exibem curtidas compartilhadas e ouvintes anônimos quando o Redis está configurado.

Na área Explorar e na listagem de podcasts, os cards são ordenados automaticamente pela **soma de curtidas e ouvintes** registrada no Redis. Os empates priorizam quem tem mais ouvintes; sem métricas, a ordem editorial permanece. A classificação se atualiza após carregar as estatísticas ou registrar novas interações, sem alterar a fila de reprodução.

## Conteúdo atual

O catálogo tem **doze episódios publicados com áudio**, incluindo JavaScript, Margaret Hamilton e a Apollo 11, o Morris Worm, Linux/Git, o Ariane 5, o Bug do Milênio, WannaCry, Ada Lovelace, ELIZA/GPT-4o, Alan Turing e Grace Hopper. As datas informadas no catálogo são dos acontecimentos, não de lançamento.

Cada episódio possui uma página pública própria para prévia em redes sociais e mecanismos de busca, como [Os 10 dias que criaram o JavaScript](https://classroommusic.vercel.app/podcasts/javascript-em-10-dias). Os cards e a página do episódio têm ações para compartilhar o permalink canônico.

As imagens de compartilhamento são JPEGs 1200×630, gerados a partir das capas do catálogo e versionados em `covers/social/`. Alterações de arte executam a workflow de geração automaticamente.

A implementação SEO/GEO inclui Open Graph, Twitter Card, `PodcastEpisode` JSON-LD, sitemap, RSS e conteúdo editorial renderizado no servidor. Consulte [docs/SEO_GEO.md](docs/SEO_GEO.md) para configuração e validação.

## Segurança e privacidade

A navegação, a reprodução e as curtidas permanecem públicas, sem login.
A API de métricas usa validação de origem, rate limit Redis em GET/POST,
limite de payload, HMAC-SHA256 e validação de dados. As páginas recebem
CSP e cabeçalhos de proteção, com exceções específicas para o VLibras.

Consulte [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md) para as regras,
os controles operacionais, limitações dos contadores anônimos e riscos
residuais. Não há promessa de segurança absoluta ou de proteção DRM.

O Vercel está configurado para publicar automaticamente apenas a branch `main`;
PRs e branches de trabalho são validados pelo GitHub Actions sem gerar
deployments de Preview. Isso ajuda a preservar a quota do plano Hobby.

## Desenvolvimento

```bash
npm install
npm run dev
npm test
```

Coloque os áudios finais em `audio/podcasts/` usando os nomes definidos em `src/podcasts.js`. Ao publicar fontes editoriais, cadastre apenas links HTTPS conferidos para o episódio correspondente. Para contribuir, consulte [CONTRIBUTING.md](CONTRIBUTING.md). Para habilitar métricas sociais na Vercel, siga [docs/SOCIAL_METRICS.md](docs/SOCIAL_METRICS.md). A contagem de ouvintes considera navegadores com pelo menos 30 segundos de mídia efetivamente reproduzida, segundo `HTMLMediaElement.played`, não pessoas autenticadas. A fila agora mostra a contagem e atualiza o ícone para Pausa enquanto a faixa está tocando.

## Estrutura

- `src/podcasts.js`: catálogo e créditos dos episódios
- `src/podcast-ui.js`: cards, fontes e estado de publicação
- `src/main.js`: controlador do player, navegação e sincronização da fila
- `src/listening.js`: qualificação de 30 segundos de reprodução real
- `src/track-rows.js`: componente reutilizável de faixa, estados de Play/Pause e ouvintes
- `src/styles/tokens.css`: tokens semânticos de temas, dimensões e componentes
- `src/social.js`: estado de curtidas e métricas
- `api/social.js`: API Vercel com contagem persistente no Upstash Redis
- `api/episode.js`: páginas públicas compartilháveis com SEO e GEO
- `api/sitemap.js`, `api/feed.js`: sitemap e feed RSS
- `src/share.js`: Web Share API e cópia de permalink
- `audio/podcasts/`: arquivos finais dos episódios
- `docs/`: documentação editorial e de acessibilidade

# Foco.dev

Catálogo acessível de podcasts sobre tecnologia, com player, fila e cards compactos de estilo editorial. Os cards exibem curtidas compartilhadas e ouvintes anônimos quando o Redis está configurado.

## Conteúdo atual

O catálogo editorial está organizado em oito episódios:

- A criação do JavaScript em 10 dias (1995)
- Margaret Hamilton e a Apollo 11 (1969)
- Da Apollo 11 ao caos do JavaScript (especial)
- O bug que destruiu o Ariane 5 (1996)
- O Bug do Milênio (2000)
- O Morris Worm (1988)
- Linus Torvalds, Linux e Git
- O bug da Knight Capital (2012)

Os créditos de produção e curadoria são exibidos nos metadados do episódio e no player. Os controles de reprodução só são habilitados depois que o áudio correspondente existe em `audio/podcasts/`.

## Desenvolvimento

```bash
npm install
npm run dev
npm test
```

Coloque os áudios finais em `audio/podcasts/` usando os nomes definidos em `src/podcasts.js`. Ao publicar fontes editoriais, cadastre apenas links HTTPS conferidos para o episódio correspondente. Para contribuir, consulte [CONTRIBUTING.md](CONTRIBUTING.md). Para habilitar métricas sociais na Vercel, siga [docs/SOCIAL_METRICS.md](docs/SOCIAL_METRICS.md). A contagem de ouvintes considera navegadores que reproduziram pelo menos 30 segundos do episódio, não pessoas autenticadas.

## Estrutura

- `src/podcasts.js`: catálogo e créditos dos episódios
- `src/podcast-ui.js`: cards, fontes e estado de publicação
- `src/main.js`: player, fila, busca, navegação e registro de reprodução
- `src/social.js`: estado de curtidas e métricas
- `api/social.js`: API Vercel com contagem persistente no Upstash Redis
- `audio/podcasts/`: arquivos finais dos episódios
- `docs/`: documentação editorial e de acessibilidade

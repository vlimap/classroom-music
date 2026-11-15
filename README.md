# Foco.dev

Catálogo acessível de podcasts sobre tecnologia, com player, fila e playlists locais.

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

Os créditos de produção e curadoria são exibidos nos metadados do episódio e no player. Os controles de reprodução só são habilitados depois que o MP3 correspondente existe em `audio/podcasts/`.

## Desenvolvimento

```bash
npm install
npm run dev
npm test
```

Coloque os áudios finais em `audio/podcasts/` usando os nomes definidos em `src/podcasts.js`. Ao publicar fontes editoriais, cadastre apenas links HTTPS conferidos para o episódio correspondente.

## Estrutura

- `src/podcasts.js`: catálogo e créditos dos episódios
- `src/podcast-ui.js`: cards, fontes e estado de publicação
- `src/main.js`: player, fila, busca e playlists
- `audio/podcasts/`: arquivos finais dos episódios
- `docs/`: documentação editorial e de acessibilidade

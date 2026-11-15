# Handoff do Foco.dev

O projeto foi reposicionado para um catálogo exclusivamente de podcasts sobre tecnologia. Não há integração com catálogo musical externo e não há renderização automática de áudio no repositório.

## Arquivos principais

- `src/podcasts.js`: os episódios, seus créditos e nomes esperados dos áudios.
- `src/podcast-ui.js`: cards, fontes editoriais e estado “em produção”.
- `src/main.js`: busca, player HTMLAudioElement, fila e navegação.
- `audio/podcasts/`: destino dos áudios finais.

## Próximo passo editorial

Colocar os arquivos de áudio em `audio/podcasts/` com os nomes definidos no catálogo. Depois, conferir locução, duração, MIME, reprodução, fila e fontes HTTPS de cada episódio.

## Validação

```bash
npm run check
npm test
```

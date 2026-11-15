# Publicar episódios

O projeto trabalha somente com podcasts de tecnologia. Os áudios são gerados fora do repositório e enviados manualmente para `audio/podcasts/`.

## Fluxo

1. Gere e revise a locução do episódio.
2. Exporte um MP3 com o nome exato definido em `src/podcasts.js`.
3. Copie o arquivo para `audio/podcasts/`.
4. Teste a reprodução no player e em uma playlist.
5. Adicione fontes editoriais HTTPS reais quando o roteiro estiver publicado.

Enquanto o arquivo não existe, o episódio permanece visível como “Áudio em preparação” e não oferece controles de reprodução.

## Créditos

Cada episódio deve manter os créditos de produção e curadoria no objeto editorial. O player usa esses metadados ao reproduzir o áudio.

# Arquitetura — Foco.dev

## Catálogo próprio
- `src/music.js`: utilitários do player e a categoria única de podcasts de tecnologia.
- `src/podcasts.js`: cinco episódios editoriais em produção, com créditos e caminhos de áudio.
- `covers/categories/*.svg`: artes vetoriais originais, sem textos.
- `src/podcasts.js`: episódios e fontes jornalísticas conferidas.
- `src/podcast-ui.js`: UI semântica para listas, detalhes e fontes dos episódios.

## Áudio
- `<audio>` HTML5, fonte estática em `audio/`.
- `audio/podcasts/`: arquivos finais dos episódios publicados.
- `HEAD` verifica se o recurso existe e responde com MIME de áudio antes de liberar o botão Ouvir.
- Faltando mídia, somente os metadados e as fontes aparecem: não há 404 reproduzível.
- MediaSession fornece controles de mídia quando o navegador suporta.
- Playlist local: `localStorage` + URL hash autocontida. Compatibilidade de leitura de `IndexedDB` para playlists antigas, sem painel de upload.

## Hospedagem e privacidade
- Vercel estática, sem funções serverless, autenticação, banco ou API FreeToUse.
- Áudio próprio pode migrar para storage/CDN externo de leitura quando necessário; não há garantia de proteção contra cópia.
- Sites externos usados apenas como referências das notícias com links; não como fonte de streaming.

## Acessibilidade
- Interface mobile-first, foco por teclado, controle de contraste/fonte, landmarks e status aria-live.
- Widget VLibras oficial integrado por acionador da marca.

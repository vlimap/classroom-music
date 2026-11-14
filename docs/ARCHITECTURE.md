# Arquitetura — Foco.dev

## Catálogo próprio
- `src/music.js`: sete categorias editoriais e quatro faixas próprias (MP3s pendentes de publicação).
- `covers/categories/*.svg`: artes vetoriais originais, sem textos.
- `src/podcasts.js`: episódios e fontes jornalísticas conferidas.
- `src/podcast-ui.js`: UI semântica, leitura assíncrona da transcrição, copiar e baixar TXT.
- `content/podcasts/*.txt`: transcrições originais do Adobe Podcast, preservadas sem correções silenciosas.

## Áudio
- `<audio>` HTML5, fonte estática em `audio/`.
- `HEAD` verifica se o recurso existe e responde com MIME de áudio antes de liberar o botão Ouvir.
- Faltando mídia, somente a transcrição e metadados aparecem: não há 404 reproduzível.
- MediaSession fornece controles de mídia quando o navegador suporta.
- Playlist local: `localStorage` + URL hash autocontida. Compatibilidade de leitura de `IndexedDB` para playlists antigas, sem painel de upload.

## Hospedagem e privacidade
- Vercel estática, sem funções serverless, autenticação, banco ou API FreeToUse.
- Áudio próprio pode migrar para storage/CDN externo de leitura quando necessário; não há garantia de proteção contra cópia.
- Transcrição pública é conteúdo editorial, não deve conter dados pessoais sensíveis.
- Sites externos usados apenas como referências das notícias com links; não como fonte de streaming.

## Acessibilidade
- Interface mobile-first, foco por teclado, controle de contraste/fonte, landmarks e status aria-live.
- Texto da transcrição selecionável, disponível mesmo sem mídia, sem timestamps artificiais.
- Widget VLibras oficial integrado por acionador da marca.

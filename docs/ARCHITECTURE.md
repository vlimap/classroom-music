# Arquitetura — Foco.dev

## Catálogo próprio
- `src/music.js`: utilitários do player e a categoria única de podcasts de tecnologia.
- `src/podcasts.js`: sete episódios com créditos, resumos e arquivos M4A versionados.
- `covers/podcasts/*.webp`: capas otimizadas dos episódios, sem textos sobre a imagem.
- `src/podcasts.js`: episódios e fontes jornalísticas conferidas.
- `src/podcast-ui.js`: UI semântica para listas, detalhes e fontes dos episódios.

## Áudio
- `<audio>` HTML5, fonte estática em `audio/`.
- `audio/podcasts/`: arquivos finais dos episódios publicados.
- `HEAD` verifica se o recurso existe e responde com MIME de áudio antes de liberar o botão Ouvir.
- Faltando mídia, somente os metadados e as fontes aparecem: não há 404 reproduzível.
- MediaSession fornece controles de mídia quando o navegador suporta.
- O catálogo é estático: episódios e metadados ficam no repositório; a fila de reprodução é mantida apenas em memória.
- Páginas de episódio renderizadas por Vercel Functions servem HTML inicial completo com Open Graph e JSON-LD. Sitemap e RSS são gerados por funções a partir do catálogo. Ver `docs/SEO_GEO.md`.

## Hospedagem e privacidade
- Catálogo e áudios estáticos na Vercel; uma Function Node.js opcional em `api/social.js` gerencia métricas anônimas via Upstash Redis. Não existe autenticação nem integração com API FreeToUse.
- UUID v4 do navegador persistido localmente; Redis armazena hashes HMAC de identificadores para deduplicar curtidas e ouvintes (reprodução efetiva de 30 segundos). Ver `docs/SOCIAL_METRICS.md`.
- Áudio próprio pode migrar para storage/CDN externo de leitura quando necessário; não há garantia de proteção contra cópia.
- Sites externos usados apenas como referências das notícias com links; não como fonte de streaming.

## Acessibilidade
- Interface mobile-first, foco por teclado, controle de contraste/fonte, landmarks e status aria-live.
- Widget VLibras oficial integrado por acionador da marca.

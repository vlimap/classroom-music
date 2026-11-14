# Handoff para Codex — Foco.dev

## Contexto

Repositório: https://github.com/vlimap/classroom-music
Branch desta implementação: `feat/vlimap-firefly-catalog` (PR #8).
Frontend estático, JavaScript ES modules e CSS, sem backend.

A interface foi reconstruída com sete categorias próprias, um catálogo de quatro faixas vlimap preparadas e a série de podcasts Foco.dev News. Não depende de API de catálogo de terceiros.

## O que está pronto

- SVGs originais sem texto em `covers/categories/`.
- `src/music.js`: categorias e faixas próprias.
- `src/podcasts.js`: episódio 14/11/2026 com links das fontes.
- `src/podcast-ui.js`: episódio e transcrição acessíveis, copiar e baixar TXT.
- `content/podcasts/2026-11-14-transcricao-adobe.txt`: arquivo literal exportado do Adobe Podcast, com erros de reconhecimento não corrigidos.
- Player com verificação de disponibilidade por `HEAD`: não reproduz URLs ausentes nem assume que um MP3 existe.

## Tarefas para prosseguir

1. **Importar mídia autoral somente quando fornecida.** Há quatro MP3 e quatro JPG no pacote `foco-dev-audios-e-capas.zip` da conversa, mas ainda não foram enviados ao GitHub. Extrair as pastas `audio/` e `covers/` para a raiz, preservando os caminhos definidos em `src/music.js`.
2. **Podcast 14/11/2026:** pedir ao produtor o MP3 exportado do Adobe Podcast. Ainda não foi anexado aqui. Nomear `audio/podcasts/focodev-news-2026-11-14.mp3`. Não substituir pelo protótipo de voz robótica da conversa sem aprovação.
3. **Revisão editorial:** comparar o áudio publicado com a transcrição bruta. Corrigir nomes (BleepingComputer, Claude Code, UnrealIRCd, Secure Exclaves, FaceStealer) e número da CVE somente mediante validação. Preservar o arquivo bruto; adicionar um segundo arquivo revisado e marcar `transcriptReviewed:true` apenas após revisão.
4. **Validação do player:** testar play, pause, seek, fim de faixa, reprodução sequencial, repetição e alternância de música/podcast; conferir MIME `audio/mpeg`, cache, HEAD e 404.
5. **Acessibilidade:** auditar teclado, foco, zoom de 200/400%, NVDA, TalkBack, contraste, transcrição e comportamento do VLibras.
6. **Performance:** otimizar MP3s/capas e medir tráfego na Vercel. Somente quando o catálogo crescer, avaliar Cloudflare R2 com bucket público de leitura.
7. **Editorial recorrente:** novo podcast requer data ISO, título, data de publicação, áudio próprio, transcrição revisada, fontes e links válidos. Nunca simular MP3 ou inventar notícia.
8. **Fechamento:** executar `npm run check` e `npm test`; atualizar testes, criar PR e aguardar CI aprovado antes de merge.

## Critérios não negociáveis

- Sem FreeToUse, Spotify ou outras fontes de áudio de terceiros.
- Sem login, backend ou banco de dados sem solicitação explícita.
- Sem upload público arbitrário, endpoints de escrita ou chaves expostas.
- Sem arquivos grandes no Git e sem substituir mídia ausente por links inexistentes.
- Evitar `innerHTML` para dados externos ou de usuários; usar `textContent`.
- Testes e documentação junto de cada mudança.
- Identificar créditos de produção vlimap e IA assistida corretamente.

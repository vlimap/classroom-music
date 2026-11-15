# Codex — Foco.dev engineering rules

Contexto principal: leia README.md, docs/ARCHITECTURE.md e docs/CODEX_HANDOFF.md antes de implementar.

- Stack: HTML5 semântico, CSS responsivo com tokens, JavaScript ES modules, Web APIs nativas, Node.js 22 para testes.
- Use convenções legíveis, funções pequenas e módulos de dados desacoplados; não adicionar frameworks sem necessidade.
- Toda alteração deve passar em npm run check e npm test.
- Acessibilidade WCAG 2.2 AA como meta; não afirmar certificação sem auditoria manual.
- Nunca reintroduzir APIs de catálogo musical ou conteúdo de terceiros; o catálogo é editorial e focado em podcasts de tecnologia.
- Nunca declarar arquivo de áudio disponível sem comprovar recurso HTTP válido.
- Para podcasts, usar apenas metadados, áudio e fontes editoriais fornecidos pelo projeto.
- Notícias e links de fontes devem ser reais, verificáveis e datados; não inventar.
- Preservar o VLibras oficial, temas, foco visível e nav mobile.
- Preservar a fila de reprodução local enquanto o catálogo permanecer estático.
- `src/main.js` orquestra estado; a construção/semântica das linhas de faixa fica em `src/track-rows.js`, a qualificação de ouvintes em `src/listening.js`. Reutilizar tokens de `src/styles/tokens.css`.
- Usar `HTMLMediaElement.played` para medir reprodução real, sem contabilizar saltos por seek ou depender da frequência de `timeupdate`. Atualizar métricas somente após confirmação da API.
- Na fila e na busca, a faixa tocando deve usar o ícone de pausa e o mesmo estado visual do player. Novos estados exigem testes de integração e acessibilidade.
- Não adicionar DRM fictício ou afirmar proteção absoluta contra downloads.
- No Windows 11, documentar PowerShell e npm (sem .cmd).

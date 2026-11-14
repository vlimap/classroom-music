# Codex — Foco.dev engineering rules

Contexto principal: leia README.md, docs/ARCHITECTURE.md e docs/CODEX_HANDOFF.md antes de implementar.

- Stack: HTML5 semântico, CSS responsivo com tokens, JavaScript ES modules, Web APIs nativas, Node.js 22 para testes.
- Use convenções legíveis, funções pequenas e módulos de dados desacoplados; não adicionar frameworks sem necessidade.
- Toda alteração deve passar em npm run check e npm test.
- Acessibilidade WCAG 2.2 AA como meta; não afirmar certificação sem auditoria manual.
- Nunca reintroduzir APIs de catálogo de músicas ou conteúdo de terceiros; a biblioteca é autoral.
- Nunca declarar arquivo de áudio disponível sem comprovar recurso HTTP válido.
- Para podcasts, usar texto literal de transcrição fornecida; produzir versão revisada separada somente após comparar com áudio.
- Notícias e links de fontes devem ser reais, verificáveis e datados; não inventar.
- Preservar o VLibras oficial, temas, foco visível e nav mobile.
- Preservar playlist local e compartilhamento por URL sem backend.
- Não adicionar DRM fictício ou afirmar proteção absoluta contra downloads.
- No Windows 11, documentar PowerShell e npm (sem .cmd).

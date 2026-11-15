# Contribuindo com o Foco.dev

Obrigado pelo interesse em melhorar o projeto. O Foco.dev é um catálogo aberto de podcasts sobre tecnologia.

## Antes de começar

- Abra uma issue para discutir mudanças maiores ou novos episódios.
- Não envie informações pessoais, credenciais ou arquivos sensíveis.
- Para novos episódios, confirme título, resumo, créditos, capa e fonte editorial antes de abrir o pull request.

## Desenvolvimento local

```bash
npm install
npm run dev
npm run check
npm test
```

Os áudios publicados ficam em `audio/podcasts/` e as capas em `covers/podcasts/`. Atualize `src/podcasts.js` quando adicionar ou alterar um episódio.

## Pull requests

1. Crie uma branch com nome descritivo, como `feat/novo-episodio` ou `fix/busca-mobile`.
2. Faça uma mudança pequena e focada.
3. Verifique a interface em desktop e mobile.
4. Execute `npm run check` e `npm test`.
5. Explique no pull request o que mudou e como foi validado.

## Conteúdo editorial

Use fontes HTTPS reais e conferidas. Não publique transcrições, dados pessoais ou material protegido sem autorização. O crédito de produção e curadoria do catálogo deve permanecer visível como definido no projeto.

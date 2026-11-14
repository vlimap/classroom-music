# Foco.dev — arquitetura e decisões

## Problema

Alunos precisam explorar categorias musicais e montar playlists sem criar conta. O projeto deve permanecer uma aplicação de frontend estática na Vercel, com custo e complexidade reduzidos.

## Fluxos

1. **Explorar** → GET `/catalog-api/music/categories/all` → rewrite externo na borda → API FreeToUse → nomes e capas oficiais.
2. **Categoria** → GET `/catalog-api/music/categories/{uuid}/tracks` → renderizar faixa com capa, título, duração e botão adicionar.
3. **Playlist** → criar/renomear/apagar via `localStorage` → renderização na biblioteca.
4. **Compartilhar** → serializar somente nome, títulos e identificadores em URL hash, sem gravar no servidor → qualquer pessoa pode abrir e salvar cópia local.
5. **Reproduzir** → somente faixas originais via Web Audio sintetizado localmente. Catálogo FreeToUse apenas descoberta/organização até licença apropriada.

## Escolhas

- Não utilizar Vercel Blob/KV para contas desconhecidas sem autenticação: escrita pública indiscriminada poderia gerar spam, crescimento de custo e abuso.
- Não chamar endpoints de dados dentro de loops com frequência elevada; busca manual e paginação limitada.
- Não usar serviços externos anônimos de armazenamento não auditados.
- O fragmento de URL é limitado em tamanho e faz validação defensiva de estruturas.
- Categorias e covers reais são usados a partir da API. O fallback é o catálogo local de composições originais.
- Sem prometer publicação pública pesquisável: isso exigiria armazenamento compartilhado e controles contra abuso.

## Riscos conhecidos

- API externa indisponível, fora do ar ou com novos limites; o proxy não corrige falhas do provedor.
- Links longos podem não funcionar em alguns aplicativos de mensagens. Limite de 20 faixas e 5,5k caracteres Base64URL.
- Exclusão do armazenamento do navegador elimina playlists pessoais; links compartilhados ainda podem recuperar as cópias.
- Vercel CDN/rewrite pode consumir tráfego, sujeito ao plano e regras da plataforma.
- Licença gratuita da FreeToUse não autoriza reprodução de suas gravações em qualquer app.
- VLibras e fontes de ícones por CDN exigem conectividade.

## Conformidade

WCAG 2.2 AA como meta, testes manuais ainda necessários. Ao usar em aula, mantenha a opção de silêncio e evite iniciar sons automaticamente.

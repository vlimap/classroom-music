# Acessibilidade — Foco.dev

**Objetivo:** aproximar a aplicação de WCAG 2.2 AA com validação técnica e testes com usuários.
A presença de VLibras isoladamente **não** torna o projeto integralmente acessível.

## Implementado

- Idioma do documento `pt-BR`, título e landmarks (`header`, `main`, `nav`, `footer`).
- Link “Ir para o conteúdo principal”.
- Hierarquia de títulos, instruções e status sem dependência exclusiva de cor.
- Botões nativos com nomes acessíveis e estado `aria-pressed` onde pertinente.
- `tablist` controlável com setas, Home e End; alternância não interrompe reprodução.
- `input type=range` nativos, rotulados para progresso e volume.
- Progresso sem notificações constantes ao leitor de telas.
- Tamanho-alvo 44x44px, indicação visível de foco e texto expansível.
- Temas claro, escuro e alto contraste; preferências persistidas localmente.
- Ausência de animações essenciais, respeito a `prefers-reduced-motion`.
- Reprodução inicial não automática. Som controlável, áudio original instrumental.
- Formatação segura dos resultados de API com `textContent` e URLs HTTPS.
- VLibras oficial com realce de foco cromaticamente integrado à marca.

## Validações que exigem avaliação manual (não certificadas)

1. Navegação apenas pelo teclado, do link de pular conteúdo até o fim do player, sem armadilhas.
2. Com NVDA + Firefox/Chrome no Windows 11: sequência de leitura, lista de resultados, tabs, estados e mensagens.
3. Refluxo de layout em zoom de 200% e 400% e largura equivalente a 320px.
4. Testes com `prefers-contrast`, modo de alto contraste do Windows e `forced-colors`.
5. Foco e sobreposição do VLibras em cada breakpoint, inclusive quando o widget externo falhar ou demorar para carregar.
6. Testes com recursos de Libras e confirmação de que a tradução automática não substitui interpretação humana.
7. Verificação automatizada com axe-core e Lighthouse após publicação em HTTPS.
8. Verificação com pessoas com deficiência visual, auditiva e motora, incluindo preferências de volume e períodos de silêncio.
9. Testar a navegação com player fixo em smartphones e teclados virtuais.
10. Checar CORS, falhas da API e indisponibilidade do serviço sem quebrar a navegação.

## Limitações de terceiros

- VLibras funciona como conteúdo e código de terceiro. Sua aparência integral e experiência do avatar não são inteiramente controláveis pela aplicação.
- Uma conexão é necessária para carregar o widget e consultar FreeToUse.
- Reprodução da biblioteca FreeToUse é desativada por padrão, devido às condições de licença. O sintetizador original não depende da rede.
- Não existe autenticação nem sincronização entre alunos; favoritos são privados ao navegador e guardados localmente.

## Referências

- https://www.w3.org/TR/WCAG22/
- https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
- https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement
- https://www.vlibras.gov.br/doc/widget/installation/webpageintegration.html
- https://www.gov.br/governodigital/pt-br/acessibilidade-e-usuario/vlibras

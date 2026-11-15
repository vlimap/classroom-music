# Acessibilidade — Foco.dev

**Objetivo:** aproximar a aplicação de WCAG 2.2 AA com validação técnica e testes com usuários.
A presença de VLibras isoladamente **não** torna o projeto integralmente acessível.

## Implementado

- Idioma do documento `pt-BR`, título e landmarks (`header`, `main`, `nav`, `footer`).
- Link “Ir para o conteúdo principal”.
- Hierarquia de títulos, instruções e status sem dependência exclusiva de cor.
- Botões nativos com nomes acessíveis e estado `aria-pressed` onde pertinente.
- Navegação lateral no desktop e barra inferior no mobile com botões nativos, nomes visíveis e destino atual marcado com `aria-current`.
- `input type=range` nativos, rotulados para progresso e volume.
- Progresso sem notificações constantes ao leitor de telas.
- Tamanho-alvo de pelo menos 44x44px nos controles, indicação visível de foco e texto ampliável.
- Temas claro, escuro e alto contraste; preferências persistidas localmente.
- Ausência de animações essenciais, respeito a `prefers-reduced-motion`.
- Reprodução inicial não automática e som controlável pelo usuário.
- Texto de conteúdo exibido com `textContent` e imagens externas limitadas a URLs HTTPS.
- VLibras oficial com realce de foco cromaticamente integrado à marca.

## Validações que exigem avaliação manual (não certificadas)

1. Navegação apenas pelo teclado, do link de pular conteúdo até o fim do player, sem armadilhas.
2. Com NVDA + Firefox/Chrome no Windows 11: sequência de leitura, lista de resultados, estados e mensagens.
3. Refluxo de layout em zoom de 200% e 400% e largura equivalente a 320px.
4. Testes com `prefers-contrast`, modo de alto contraste do Windows e `forced-colors`.
5. Foco e sobreposição do VLibras em cada breakpoint, inclusive quando o widget externo falhar ou demorar para carregar.
6. Testes com recursos de Libras e confirmação de que a tradução automática não substitui interpretação humana.
7. Verificação automatizada com axe-core e Lighthouse após publicação em HTTPS.
8. Verificação com pessoas com deficiência visual, auditiva e motora, incluindo preferências de volume e períodos de silêncio.
9. Testar a navegação com player fixo em smartphones e teclados virtuais.
10. Checar indisponibilidade dos arquivos de áudio sem quebrar a navegação.

## Limitações de terceiros

- VLibras funciona como conteúdo e código de terceiro. Sua aparência integral e experiência do avatar não são inteiramente controláveis pela aplicação.
- Uma conexão é necessária para carregar o widget, os ícones e os áudios publicados.
- Não existe autenticação nem sincronização entre alunos; preferências de acessibilidade ficam privadas ao navegador.

## Referências

- https://www.w3.org/TR/WCAG22/
- https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/
- https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement
- https://www.vlibras.gov.br/doc/widget/installation/webpageintegration.html
- https://www.gov.br/governodigital/pt-br/acessibilidade-e-usuario/vlibras

## Widget VLibras: cor e estabilidade

- O botão oficial é estilizado em tempo de execução pelo elemento `window.VLibrasWidget.initBtn` exposto pela documentação oficial, com fundo verde da marca e contorno areia.
- O símbolo e o tradutor não são substituídos, evitando adulterações e perdas de funcionalidade.
- A preferência por alto contraste adapta o contorno; validação em navegadores reais é necessária.
- Não substitui intérprete de Libras ou revisão por pessoa usuária de Libras.

## Áudio dos episódios

- A interface atual mantém a reprodução de arquivos que já estejam salvos em IndexedDB; não há controle para importar novos arquivos.
- As gravações permanecem em IndexedDB no navegador de origem. O compartilhamento não contém blobs, apenas metadados.
- O player utiliza `HTMLAudioElement` para áudios publicados e arquivos locais legados.
- Compatibilidade de codecs depende do navegador; não existe transcodificação.
- O armazenamento pode ser descartado pelo navegador se limpar dados ou ultrapassar a quota. Guarde cópias dos arquivos originais.

## Episódios

- O podcast é acessível por navegação inferior e menu desktop.
- Cada episódio possui página com título, data, áudio quando disponível e fontes editoriais.
- Se o áudio ainda não está publicado, o botão Ouvir fica desabilitado e as fontes continuam acessíveis.

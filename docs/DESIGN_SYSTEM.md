# Design System — Foco.dev v1

## Princípios

1. **Foco antes de efeito**: sem carrosséis automáticos, banners animados ou reprodução involuntária.
2. **Acolhimento e legibilidade**: tons quentes neutros e contraste mensurável.
3. **Uma ação por controle**: botões com estados claros e rótulos acessíveis.
4. **Áudio sob controle**: início sempre sob ação do usuário e volume inicial moderado.
5. **Acessível por padrão**: sem depender exclusivamente de cores, gestos ou ícones.

## Identidade

Nome: **foco.dev**. Logotipo: colchetes angulares de código e sinal sonoro minimalista, com bordas arredondadas.
O logo SVG tem formas vetoriais próprias e não utiliza logotipos de terceiros.

## Cores semânticas

| Token | Escuro | Claro | Uso |
| --- | --- | --- | --- |
| `--color-bg` | `#111714` | `#F3F6F0` | Plano de fundo |
| `--color-surface` | `#1B241E` | `#FFFFFF` | Superfície de cartões |
| `--color-surface-raised` | `#263129` | `#E6ECE5` | Fila, faixa ativa |
| `--color-text` | `#F3F5EF` | `#18251D` | Texto principal |
| `--color-text-muted` | `#C4D0C6` | `#41564A` | Texto secundário |
| `--color-border` | `#68796D` | `#718678` | Delimitação de componentes |
| `--color-accent` | `#B9E3A8` | `#23613F` | Ação primária |
| `--color-accent-content` | `#152116` | `#FFFFFF` | Texto sobre ação primária |
| `--color-sage` | `#D0E7D0` | `#245C3E` | Links e sinalizadores |
| `--color-focus` | `#F2D785` | `#204E89` | Foco via teclado |

Contrastes calculados em sRGB: texto principal/superfície escura 14,51:1; texto secundário/superfície escura 10,01:1; texto principal/fundo claro 14,57:1; texto secundário/superfície branca 7,91:1; texto/botão principal escuro 11,59:1 e claro 7,36:1; link verde no modo claro 7,85:1. A paleta reserva os acentos para ações e estados, com texto e ícones legíveis sobre as superfícies. Estados ativos e indisponíveis também recebem rótulos, contornos ou texto, para não depender somente da cor. Recalcular contrastes após qualquer ajuste e validar com ferramenta automatizada antes da publicação.

O modo de alto contraste utiliza preto/branco e acentos de alto contraste; preferência `forced-colors` do sistema é preservada.

## Tipografia

- Fonte: pilha local de sistema (`system-ui`, Segoe UI, Roboto, Arial).
- Base: 16px; opção ampliada: 18px.
- Títulos: escala fluida `clamp` e peso 700/750.
- Espaçamento entre linhas do corpo: 1,55.
- Não depende de fontes externas ou carregamentos assíncronos.

## Espaçamento e dimensões

| Token | Valor |
| --- | --- |
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 24px |
| `--space-6` | 32px |
| `--space-7` | 48px |
| `--radius-sm` | 10px |
| `--radius-md` | 16px |
| `--radius-lg` | 24px |
| `--tap-target` | 44px |

## Componentes

- **Button primary**: ação explícita de busca e reprodução.
- **Button quiet**: preferências de visualização, sem aparência de CTA principal.
- **Icon button**: ícone acompanhado de `aria-label`, `title`, estado `aria-pressed` quando apropriado.
- **Track row**: agrupamento de capa, título, artista, disponibilidade e ações; controles nativos com nomes acessíveis.
- **Navegação**: navegação lateral no desktop e barra inferior no mobile, com `aria-current` sincronizado e botões nativos.
- **Queue**: lista ordenada sem alteração surpresa do foco.
- **Range**: nativo, com rótulos e descrições de valor.
- **Notice**: aviso sem cor como único recurso informativo.
- **Live status**: mensagens esporádicas via região `role=status` (sem anunciar a passagem do tempo incessantemente).

## Responsividade

- Desktop: navegação e playlists salvas na lateral, conteúdo ao centro e player fixo inferior.
- Tablet e celular: navegação inferior, cabeçalho compacto e mini player acima do dock; controles secundários aparecem ao expandir.
- A navegação móvel começa até 760px para manter acesso aos destinos em tablets estreitos.
- O player e o VLibras respeitam a área segura do dispositivo; o conteúdo recebe espaço inferior para não ficar encoberto.
- Grade de descoberta com três colunas em telas médias e duas em celulares; linhas de episódios preservam alvo de toque de pelo menos 44px.
- Respeitar `prefers-reduced-motion`, zoom e `forced-colors`; não introduzir rolagem horizontal deliberada.

## Organização visual

- **Proximidade:** navegação agrupada à parte do conteúdo; capa, título, créditos e ações permanecem juntos em cada episódio.
- **Similaridade:** os mesmos destinos mantêm ícone, nome e estado ativo entre desktop e mobile.
- **Figura e fundo:** planos escalonados separam navegação, cartões, player e conteúdo sem adicionar divisórias em cada elemento.
- **Continuidade:** o mini player permanece acima da navegação inferior e conserva a faixa selecionada ao trocar de tela.
- **Hierarquia de cor:** verde claro/escuro destaca a ação principal conforme o tema; cores de perigo e foco têm papéis próprios.

## Aplicação do VLibras

As variáveis `--vlibras-btn-focus-visible-outline`, `--vlibras-btn-focus-visible-shadow`, `--vlibras-btn-hover-filter` são suportadas oficialmente. O botão auxiliar “Libras” usa as cores da marca e aciona o controle oficial quando disponível. A personalização de cor/vestimenta do avatar oficial exige parceria formal, portanto não foi falsamente simulada.

Documentação: https://www.vlibras.gov.br/doc/widget/installation/webpageintegration.html

## Atualização mobile e iconografia

- Ícones: Bootstrap Icons 1.13.2, publicados via jsDelivr; não exige importar o framework Bootstrap.
- Conteúdo acessível: ícones decorativos com `aria-hidden`, botões com `aria-label` e textos na navegação inferior.
- Capas: SVGs próprios para a identidade de podcasts, com fallback para o logo.
- Dock inferior com 5 destinos móveis: Categorias, Podcasts, Playlists, Fila e Ajustes; destaque da seleção por contraste e `aria-current`.
- Mini-player acima do dock, com play/next de acesso imediato e modo expandido para os demais controles.
- Safe-area: `env(safe-area-inset-bottom)`; alvos de toque priorizados, foco navegável e textos legíveis.

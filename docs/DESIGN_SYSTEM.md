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
| `--color-bg` | `#151A18` | `#F6F4ED` | Plano de fundo |
| `--color-surface` | `#202722` | `#FFFFFF` | Superfície de cartões |
| `--color-surface-raised` | `#29332C` | `#EAECE5` | Fila, faixa ativa |
| `--color-text` | `#F6F3E9` | `#1B2720` | Texto principal |
| `--color-text-muted` | `#CED6CB` | `#46584D` | Texto secundário |
| `--color-border` | `#728476` | `#728878` | Delimitação de componentes |
| `--color-accent` | `#EACB97` | `#315D49` | Ação primária |
| `--color-accent-content` | `#172019` | `#FFFFFF` | Texto sobre ação primária |
| `--color-sage` | `#B9D8C5` | `#315D49` | Links e sinalizadores |
| `--color-focus` | `#F4DCAE` | `#204E89` | Foco via teclado |

Contrastes calculados em sRGB (aproximados): texto primário sobre superfície escura 13,76:1; texto secundário sobre superfície escura 10,26:1; texto claro principal sobre branco 15,47:1; texto claro secundário sobre branco 7,60:1; fundo da ação primária no modo claro com texto branco 7,52:1.

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
- **Track row**: botão com título e artista; sem `innerHTML` alimentado por dados externos.
- **Tabs**: `tablist`, `tab`, `tabpanel`; teclas esquerda/direita/Home/End.
- **Queue**: lista ordenada sem alteração surpresa do foco.
- **Range**: nativo, com rótulos e descrições de valor.
- **Notice**: aviso sem cor como único recurso informativo.
- **Live status**: mensagens esporádicas via região `role=status` (sem anunciar a passagem do tempo incessantemente).

## Responsividade

- Desktop: biblioteca + fila lado a lado, player fixo inferior.
- Tablet: fila abaixo da biblioteca, volume na segunda linha.
- Celular: cabeçalho e preferências quebram linhas; controles prioritários preservados.
- Sem rolagem horizontal deliberada e sem efeitos que conflitem com `prefers-reduced-motion`.

## Aplicação do VLibras

As variáveis `--vlibras-btn-focus-visible-outline`, `--vlibras-btn-focus-visible-shadow`, `--vlibras-btn-hover-filter` são suportadas oficialmente. O botão auxiliar “Libras” usa as cores da marca e aciona o controle oficial quando disponível. A personalização de cor/vestimenta do avatar oficial exige parceria formal, portanto não foi falsamente simulada.

Documentação: https://www.vlibras.gov.br/doc/widget/installation/webpageintegration.html

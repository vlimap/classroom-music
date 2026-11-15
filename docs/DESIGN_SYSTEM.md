# Design system — Foco.dev v2

## Diretrizes

O Foco.dev é um catálogo de podcasts com reprodução controlada pelo usuário.
O design deve facilitar descoberta, escuta e compartilhamento, com acessibilidade
como comportamento padrão. Nunca iniciar áudio automaticamente.

- **Hierarquia:** título e capa do episódio primeiro, ação principal em destaque,
  informações secundárias com contraste suficiente.
- **Estados visíveis:** ícones, texto e atributos de acessibilidade transmitem
  o mesmo estado. A cor sozinha nunca identifica reprodução ou seleção.
- **Consistência:** a fila, a busca e o player observam a mesma faixa selecionada;
  não criar estados de reprodução separados nos componentes.
- **Sem dependências desnecessárias:** HTML, CSS com tokens e ES Modules nativos;
  Bootstrap Icons para iconografia, VLibras oficial para acessibilidade.

## Tokens: fonte única de verdade

O arquivo `src/styles/tokens.css` define a paleta semântica e dimensões.
Componentes usam `var(--token)` em vez de copiar valores hexadecimais.

| Token | Escuro | Claro | Uso |
| --- | --- | --- | --- |
| `--color-bg` | `#111714` | `#F3F6F0` | Fundo |
| `--color-surface` | `#1B241E` | `#FFFFFF` | Cartões |
| `--color-surface-raised` | `#263129` | `#E6ECE5` | Faixa selecionada |
| `--color-text` | `#F3F5EF` | `#18251D` | Texto principal |
| `--color-text-muted` | `#C4D0C6` | `#41564A` | Metadados |
| `--color-accent` | `#B9E3A8` | `#23613F` | Ações e reprodução |
| `--color-accent-soft` | `#263A2B` | `#DFEDE0` | Estado ativo |
| `--color-focus` | `#F2D785` | `#204E89` | Foco de teclado |

O alto contraste usa tokens próprios `[data-contrast="high"]`.
Os espaçamentos variam de `--space-1` (4px) a `--space-7` (48px).
Raio: `--radius-sm`, `--radius-md`, `--radius-lg` e
`--radius-pill`. Mínimo de toque: `--tap-target` = 44px.
Capas de faixas: `--track-artwork-size` = 54px,
`--track-artwork-mobile-size` = 45px.

A fonte utiliza apenas a pilha local do sistema
(`system-ui`, Segoe UI, Roboto e equivalentes), com opção ampliada de 18px.

## Componentes e estados

### Linha de episódio (`.song-row`)

Compartilhada entre Fila e resultados da busca. O componente exibe capa,
título, autor/estado, total de ouvintes e ações de reprodução/detalhes.

| Estado | `data-playback` | Ícone | Ação do botão | Texto secundário |
| --- | --- | --- | --- | --- |
| Outra faixa | `idle` | Play | Selecionar e tocar | Foco.dev e ouvintes |
| Faixa atual, pausada | `paused` | Play | Retomar do mesmo ponto | Foco.dev e ouvintes |
| Faixa atual, tocando | `playing` | Pause | Pausar | **Reproduzindo** e ouvintes |

A seleção tem `aria-current="true"`; o botão tem `aria-pressed` e
`aria-label="Reproduzir…"/"Pausar…"`. O CSS utiliza apenas
`data-playback` e `aria-pressed` para os destaques. O estado do ícone
é aplicado em `src/track-rows.js` e sincronizado em `src/main.js` a partir
do elemento `<audio>`, inclusive quando o sistema móvel pausa a reprodução.

**Ouvintes:** a linha mostra `0 ouvintes`, `1 ouvinte`, etc., sem inventar
dados. Se a API não estiver disponível, mostra `— ouvintes`. O valor é
atualizado após a confirmação no servidor, sem reconstruir toda a fila.

### Card editorial (`.podcast-card`)

- Largura até 340px no celular, cabeçalho Foco.dev e arte 4:3.
- Título com máximo de duas linhas e texto de disponibilidade.
- Barra com **curtida**, **compartilhar** e **ouvintes**, independentes da
  ação que abre o episódio.
- Coração usa `aria-pressed`, título e estado de desabilitado quando a API
  está indisponível.

### Player

- Mini player fixo na parte inferior, acima da navegação mobile.
- Botão principal alterna **Play/Pause** com estado `aria-pressed`.
- Linha de progresso e duração seguem `timeupdate` e `seeked` nativos,
  sem timer de atualização contínuo.
- `src/listening.js` contabiliza 30 segundos usando o total dos
  `TimeRanges` de `HTMLMediaElement.played`, desconsiderando saltos por
  seek. Redis mantém a deduplicação anônima por navegador.

### Navegação e acessibilidade

- No celular, três destinos iguais: **Explorar, Fila e Sobre**.
- Na lateral direita, o botão VLibras fica na metade visível da tela e
  aciona o widget oficial.
- Respeitar `safe-area-inset-bottom`, `prefers-reduced-motion`, zoom,
  `forced-colors` e navegação por teclado.
- As ações devem manter alvo de toque de pelo menos 44px e foco visível.

## Arquitetura dos componentes

| Módulo | Responsabilidade |
| --- | --- |
| `src/styles/tokens.css` | Identidade, dimensões e temas |
| `src/styles/app.css` | Layout responsivo e estilos dos componentes |
| `src/main.js` | Orquestração do player, fila, navegação e preferências |
| `src/listening.js` | Qualificação de reprodução por intervalos de áudio |
| `src/track-rows.js` | Ícone, rótulo, seleção e métricas nas linhas |
| `src/podcast-ui.js` | Cards editoriais, detalhe e compartilhamento |
| `src/social.js` | Leitura e gravação dos contadores com API |
| `api/social.js` | Persistência, validação e controles de segurança |

Não duplicar o tempo de reprodução em vários módulos nem atualizar o contador
local antes de o Redis confirmar a gravação. Não usar `innerHTML` para dados
de episódios. Novos controles devem reutilizar tokens e estados existentes.

## Revisão e testes

1. `npm run check` e `npm test`.
2. No celular: tocar uma faixa da fila e verificar que seu botão muda para
   **Pause**, a linha mostra **Reproduzindo**, e o player acompanha.
3. Pausar na fila e retomar pelo mesmo botão, sem reiniciar o áudio.
4. Ouvir 30 segundos reais, confirmar a contagem na fila e no Explorar.
   Avançar a barra de progresso não deve aumentar o total.
5. Conferir VLibras, busca, acessibilidade, tema claro/escuro, contraste,
   compartilhamento e URLs de podcast.
6. Validar visualmente Chrome Android e desktop antes de afirmar conformidade
   WCAG 2.2 AA; testes automatizados não substituem auditoria manual.

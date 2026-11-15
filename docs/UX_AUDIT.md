# Auditoria de UI e UX — Foco.dev

## Escopo

Revisão do catálogo editorial, navegação, busca, podcasts, fila, player, aparência e acessibilidade, considerando desktop e mobile. O projeto é estático: os conteúdos são cadastrados nos arquivos do projeto.

## Melhorias incorporadas

- Navegação principal no topo e navegação inferior no mobile, mantendo o player visível.
- Estados de áudio indisponível e ações de reprodução apenas para arquivos reconhecidos pelo servidor.
- Episódios com página própria, fontes editoriais e indicação explícita quando o áudio falta.
- Controles rotulados, foco visível, opções de contraste e tamanho do texto, redução de movimento e áreas seguras no mobile.

## Heurísticas de Nielsen

| Heurística | Aplicação e oportunidade |
| --- | --- |
| Estado do sistema | Disponibilidade do áudio e progresso aparecem no player; falhas e ações são anunciadas. |
| Linguagem familiar | Podcasts, busca e fila usam nomes diretos. |
| Controle e liberdade | É possível pausar, navegar e controlar a fila. |
| Consistência | A navegação mantém destinos e player entre telas; busca fica na lateral e na tela Explorar. |
| Prevenção de erros | Áudio indisponível não apresenta ação de reprodução. |
| Reconhecimento | Capas, rótulos e biblioteca lateral ajudam a reencontrar conteúdos. |
| Eficiência | Player persistente e busca reduzem etapas; incluir busca direta no dock merece avaliação com usuários. |
| Simplicidade | Áreas de navegação, conteúdo e reprodução são agrupadas por função. |
| Recuperação de erros | Mensagens indicam falhas; falta oferecer recuperação mais específica para problemas de rede ou mídia. |
| Ajuda | Ajustes explicam recursos e limites; faltam orientações para produtores cadastrarem novos conteúdos. |

## Gestalt e cor

Proximidade agrupa capa, título e ações. Similaridade mantém botões e cartões coerentes. Superfícies distintas separam navegação, conteúdo e player. O verde destaca ações e estados, acompanhados por texto ou ícones para não depender somente de cor.

## Prioridades restantes

1. Avaliar com usuários os cinco episódios de tecnologia e ajustar roteiro, duração e navegação conforme o feedback.
2. Definir o fluxo de produção: hoje não existe editor, geração de áudio, upload público, contas ou armazenamento compartilhado. A inclusão de novos conteúdos exige cadastro e publicação dos arquivos pelo projeto.
3. Avaliar com usuários a navegação mobile, principalmente a busca, o mini player e a sobreposição do VLibras.
4. Realizar auditoria manual de teclado, leitores de tela, contraste e zoom de 200% e 400%. WCAG 2.2 AA é uma meta, não uma certificação declarada.
5. Avaliar custo de tráfego e hospedagem à medida que o catálogo crescer.

# Foco.dev

Player de foco, simples e acessível, para estudar e programar. Deploy estático, sem servidor, banco de dados, credenciais ou cadastro.

**Identidade:** Foco.dev (repositório técnico: `classroom-music`). A marca é independente do Spotify, do Senac e da FreeToUse.

## Recursos

- Quatro ambientes instrumentais **originais**, sintetizados no navegador (Web Audio API). Nenhuma gravação externa é distribuída pelo repositório.
- Play/pausa, anterior, próxima, ordem aleatória, repetição (desligada/fila/faixa), progresso, volume, mute e favoritos locais.
- Próxima faixa automática depois do primeiro Play; a reprodução inicial exige interação por política dos navegadores.
- Catálogo pesquisável da API pública FreeToUse, com paginação e imagens/nomes de seus respectivos autores.
- Layout adaptativo, temas claro e escuro, modo alto contraste, ampliação do texto, teclas nativas de navegação, rótulos acessíveis e anúncio de mudanças importantes.
- Integração oficial do VLibras, com botão auxiliar da própria marca e foco personalizável conforme as opções oficiais.
- Preferências e favoritos salvos no armazenamento local do navegador, sem sincronização entre dispositivos.

## Uso local

Com Node.js 20 ou superior, execute na raiz:

```bash
npm test
npm run check
```

Para visualizar com um servidor HTTP estático, por exemplo:

```bash
npx serve .
```

Também funciona com extensões de servidor estático do VS Code. Evite abrir o `index.html` via `file://` porque módulos ES podem ser bloqueados pelo navegador.

## Deploy na Vercel

1. Importe `vlimap/classroom-music` na Vercel.
2. Selecione **Other** como framework.
3. Deixe o projeto na raiz (`./`) e a publicação estática sem build.
4. Faça o deploy. O arquivo `index.html` é a entrada.

Os arquivos podem ser publicados diretamente pela Vercel; não há endpoints próprios, secrets nem banco de dados.

## API musical: separação entre metadados e execução

A API `https://api.freetouse.com/v3` é pública e não requer chave, mas isso **não significa licença irrestrita para integrar e redistribuir suas gravações em aplicativos**. A licença gratuita das obras cobre determinados conteúdos de usuários e veda seu uso em produtos digitais e determinadas outras modalidades.

Por segurança, `src/api.js` tem `LICENSED_STREAMING = false`. Isso mantém as buscas e metadados disponíveis, mas **impede a reprodução do MP3 pela aplicação**. Só altere esta opção após obter autorização formal compatível com a finalidade concreta do projeto, incluindo eventual reprodução coletiva em aula. A API pode também impor CORS ou limites não documentados; verifique no navegador de destino.

As quatro faixas de ambiente disponíveis no app são geradas localmente pelo código original `src/audio.js`, sem acesso a gravações de terceiros. São demonstrações sintéticas leves, não masters de músicas existentes. Nenhuma alegação de licença de terceiros é feita sobre elas.

Referências: https://freetouse.com/api e https://freetouse.com/license

## Acessibilidade

Meta de projeto: WCAG 2.2 AA. Foram implementados mecanismos básicos de acessibilidade, mas **não se afirma conformidade plena sem auditoria humana**. Consulte `docs/ACCESSIBILITY.md` para um checklist de validação com teclado, NVDA e pessoas usuárias de tecnologias assistivas.

O widget do VLibras é uma ferramenta de apoio, não substitui intérprete humano em atividades educacionais. A personalização integral de seu avatar é restrita a instituições parceiras; esta implementação não altera indevidamente o avatar oficial.

Referências: https://www.vlibras.gov.br/doc/widget/installation/webpageintegration.html e https://www.vlibras.gov.br/doc/widget/functionalities/customize-avatar.html

## Estrutura

- `index.html`: semântica, navegação, controles e widget VLibras.
- `logo.svg`: marca vetorial original.
- `src/styles/tokens.css`: design tokens, temas e acessibilidade cromática.
- `src/styles/app.css`: layouts e componentes.
- `src/main.js`: estado e interações da interface.
- `src/music.js`: faixas e regras puras de navegação.
- `src/audio.js`: sintetizador original via Web Audio.
- `src/api.js`: client público com filtragem e busca.
- `docs/`: design system e roteiro de avaliação de acessibilidade.
- `tests/`: testes unitários de lógica, sanitização e integração do client.

## Observações

- Sem backend, não há playlists compartilhadas multiusuário ou moderação persistente. Favoritos são locais.
- A reprodução pode depender de gestos do usuário e das políticas de economia de bateria de cada navegador.
- A ferramenta é independente, sem afiliação comercial a plataformas de streaming.

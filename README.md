# Foco.dev — categorias e playlists compartilháveis

Aplicação estática, mobile-first, sem cadastro, sem servidor próprio e sem banco de dados. [Produção](https://classroommusic.vercel.app/) · [Código](https://github.com/vlimap/classroom-music).

## Funcionalidades

- Categorias e respectivas capas da [API oficial FreeToUse](https://freetouse.com/api).
- Busca de músicas por título, artista ou estilo; paginação acionada manualmente.
- Quatro faixas instrumentais originais sintetizadas no próprio navegador, sem streaming externo.
- **Importação de áudio local** com IndexedDB: escolha MP3, M4A, AAC, OGG, OPUS, WAV, WebM ou FLAC que você possui autorização para usar. Não há upload, hospedagem ou download automático da FreeToUse.
- Um único player para faixas originais e arquivos importados, com play/pausa, fila, progresso, shuffle, repetição e volume.
- VLibras oficial com botão em verde da marca (`#315D49`) e borda areia (`#D7B98A`), preservando a identidade do símbolo e adaptação ao alto contraste.
- Player com play/pausa, faixa anterior/próxima, repetição, aleatório, progresso e volume.
- Criação, renomeação e exclusão de playlists pessoais.
- Inclusão e remoção de músicas nas playlists, até 20 faixas por playlist e 30 playlists locais.
- Compartilhamento por **link autocontido**, incluindo metadados das músicas. Quem tiver o link abre uma cópia e pode salvá-la no próprio navegador, sem login.
- Mobile com barra de navegação fixa, Bootstrap Icons e player compacto com controles expansíveis.
- Tema claro/escuro, alto contraste, texto ampliado, atalhos de teclado nativos, regiões de anúncio e widget oficial VLibras.
- Nenhum rastreador, nenhuma escrita remota de dados de usuários.

## Arquitetura

```text
Browser (JavaScript + localStorage + IndexedDB)
 ├── HTML/CSS/Bootstrap Icons
 ├── Synth Web Audio (faixas originais)
 ├── Áudios pessoais (Blobs no IndexedDB, exclusivamente no dispositivo)
 ├── Playlists locais
 ├── URL #p=<payload> para compartilhar
 └── GET /catalog-api/music/*   ──> Vercel rewrite ──> api.freetouse.com/v3/music/*
```

O `vercel.json` encaminha somente as rotas de leitura ao catálogo externo. **Não há Vercel Functions, Redis, Blob, KV nem um backend de escrita**. O proxy externo evita problemas de CORS no navegador, mas ainda depende da disponibilidade do servidor upstream e consome tráfego da Vercel. Nenhuma plataforma oferece garantia de cota ilimitada ou de que um projeto nunca será suspenso: acompanhe as métricas de uso e observe as condições dos serviços.

### Playlists públicas: o que é possível sem backend

- **Compartilhamento público por link:** disponível. Dados estão dentro do fragmento `#p=` da URL, transmitido de forma explícita pelo próprio usuário; o fragmento não é enviado ao servidor HTTP.
- **Persistência pessoal:** playlists no localStorage, arquivos MP3/áudio no IndexedDB. Podem ser apagados ao limpar dados do navegador, no modo privado ou ao mudar de dispositivo.
- **Compartilhamento de áudios importados:** apenas título, identificador e demais metadados entram no link; a gravação permanece no dispositivo original e não reproduz em outros navegadores sem importação e armazenamento próprios.
- **Catálogo global de playlists pesquisável, avaliações e edições simultâneas:** não implementados, pois exigem armazenamento compartilhado, moderação e mecanismos contra spam. Não há banco persistente no deploy estático.

Não insira nomes completos, telefones, dados pessoais ou conteúdo sensível nos títulos de playlists. O link pode ser encaminhado por terceiros. O payload usa Base64URL e **não criptografa** os dados.

## Licenças de áudio

A API pública da FreeToUse permite consultar o catálogo, mas o acesso gratuito à API **não é uma autorização genérica para reproduzir, distribuir ou integrar suas gravações em um produto digital**. A [Free To Use License](https://freetouse.com/license) proíbe determinados usos sob a Free License; confira a autorização específica antes de ativar áudio remoto. As músicas do catálogo ficam disponíveis para explorar e organizar em playlists, porém o aplicativo **não reproduz seus arquivos MP3**. Essa restrição é deliberada.

As quatro faixas originais são geradas localmente em `src/audio.js`, utilizando sequências desenvolvidas para o projeto. O app não hospeda gravações protegidas de terceiros. A Free License restringe uso em produtos digitais e redistribuição de gravações, portanto adquirir/baixar um MP3 da FreeToUse não autoriza publicá-lo numa playlist de streaming. Quem possui licença específica para outra gravação pode importar o arquivo localmente sob sua responsabilidade. O limite do Foco.dev é de **40 áudios, 25 MB por arquivo e 250 MB por navegador**, sujeito ainda a armazenamento disponível e quotas de cada dispositivo. Não existe backup remoto ou sincronização; mantenha os arquivos originais em outro local.

## Arquivos

- `index.html` — página, player, diálogos e VLibras
- `src/main.js` — navegação, categorias, player e playlists
- `src/api.js` — consultas e normalização do catálogo
- `src/playlists.js` — persistência e links compartilháveis, sem anexar áudio
- `src/local-audio.js` — IndexedDB, validação e gerenciamento de arquivos locais
- `src/music.js`, `src/audio.js` — faixas e sintetizador
- `src/styles/tokens.css`, `src/styles/app.css` — design system e layouts
- `vercel.json` — proxy externo declarativo
- `covers/` — capas SVG das faixas originais
- `tests/` — testes unitários e regressão

## Desenvolvimento no Windows 11

Instale Node.js 22 ou superior.

```powershell
npm test
npm run check
npx serve .
```

Use um servidor HTTP para importar módulos ES. A instalação de dependências de produção não é necessária.

## Deploy na Vercel

- Importe o repositório do GitHub.
- Framework preset: **Other**; build command: vazio; output: raiz do projeto.
- O `vercel.json` aplica o rewrite do catálogo.
- Verifique depois do deploy o endpoint `/catalog-api/music/categories/all?limit=1`. Ele deve retornar JSON, não HTML.
- Teste o player em navegadores reais e consulte os logs/consumo de bandwidth na Vercel.

## Acessibilidade

Objetivo: WCAG 2.2 AA. Design com nomes acessíveis, navegação nativa, foco visível, controles de volume e contraste. **Ainda é necessária uma auditoria manual** com NVDA, VoiceOver, teclado, zoom e pessoas usuárias de tecnologias assistivas. VLibras é opcional e requer conectividade.

## Referências

- [API FreeToUse](https://freetouse.com/api)
- [Licença FreeToUse](https://freetouse.com/license)
- [Rewrites externos da Vercel](https://vercel.com/docs/routing/rewrites)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Bootstrap Icons](https://icons.getbootstrap.com/)
- [VLibras](https://www.vlibras.gov.br/doc/widget/installation/webpageintegration.html)

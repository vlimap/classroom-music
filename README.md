# Foco.dev — música e podcasts autorais

Aplicativo estático, mobile-first e acessível. **Produção e curadoria: vlimap.** Não utiliza a API FreeToUse ou APIs de catálogo de terceiros; somente arquivos de mídia publicados pelo próprio projeto.

## Categorias próprias
- Lo-fi & Focus
- Ambient & Zen
- Love & Romance
- Rock & Indie
- Jazz & Coffee
- Electronic & Chill
- Podcasts & Notícias (Foco.dev News)

As quatro primeiras gravações preparadas (Lo-fi/Ambient) estão **cadastradas**, mas seus MP3s e capas JPG ainda dependem de upload. O player verifica os arquivos com HEAD antes de habilitar reprodução. Não exponha controles de play para arquivos ausentes; o site continua navegável.

## Podcast e transcrição

O episódio piloto **Foco.dev News — 14/11/2026** consta em `src/podcasts.js`, com transcrição literal do Adobe Podcast em `content/podcasts/2026-11-14-transcricao-adobe.txt`.

O texto original foi preservado. **A transcrição automática não foi revisada** e contém erros de reconhecimento em nomes próprios e termos técnicos. Ela é apresentada com aviso editorial e opção de baixar/copiar. São incluídas seis URLs de reportagens conferidas e datadas. Não marque uma transcrição como revisada sem validação contra o áudio.

**O MP3 gerado no Adobe Podcast NÃO foi anexado e NÃO está no repositório**. O endereço reservado é `/audio/podcasts/focodev-news-2026-11-14.mp3`. Quando o arquivo for publicado, o player o reconhece automaticamente na próxima visita (HEAD com resposta de MIME de áudio).

## Organização

```text
index.html
src/
  main.js            # Categorias, busca, playlists e player
  music.js           # Gêneros e músicas próprias
  podcasts.js        # Metadados editoriais do podcast, URLs e status de revisão
  podcast-ui.js      # Lista de episódios e leitura acessível das transcrições
  playlists.js       # Playlists locais compartilháveis por link
  local-audio.js     # Compatibilidade de leitura com arquivos pessoais antigos
  styles/
covers/categories/   # Capas SVG limpas, sem textos
content/podcasts/    # Transcrições TXT do Adobe Podcast
audio/               # MP3s da produção própria (pendentes de publicação)
docs/CODEX_HANDOFF.md
AGENTS.md
```

## Desenvolvimento e testes (Windows 11)

Node.js 20 ou superior. Sem dependências de produção e sem backend.

```powershell
npm run check
npm test
npx serve .
```

O CI usa Node.js 22 e valida sintaxe e testes.

## Publicação e limites

Frontend na Vercel, sem banco, sem funções de escrita e sem API externa de música. As playlists ficam no `localStorage`, são compartilháveis por link autocontido, mas **não** são indexadas globalmente. Os arquivos de áudio publicados são baixados pelo navegador: não há DRM e não é correto prometer proteção anticópia. A Vercel contabiliza tráfego conforme as regras do plano; se necessário, mover os MP3s para object storage/CDN.

## Direitos e ética editorial

- Músicas geradas com auxílio de Adobe Firefly e selecionadas por vlimap; confirmar licença para publicar faixas autônomas.
- Produção, seleção e curadoria vlimap não implicam direitos autorais exclusivos automáticos sobre geração integral de IA.
- Podcasts exigem data, fontes originais verificadas e revisão dos nomes técnicos.
- Não inventar fontes nem episódios; não modificar transcrições literalmente recebidas sem controle de versão.
- Acessibilidade é requisito: navegação por teclado, texto alternativo adequado, transcrição em texto selecionável e VLibras oficial.

Consulte `docs/CODEX_HANDOFF.md` para continuar a implementação com Codex.

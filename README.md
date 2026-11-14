# Foco.dev Sessions — vlimap

Player musical acessível para estudar e programar, com playlists compartilháveis sem login.

**Produção e curadoria:** vlimap. Áudio gerado com auxílio de Adobe Firefly. Esse crédito editorial não garante, por si só, direitos autorais exclusivos sobre conteúdo gerado integralmente por IA.

## Foco.dev Sessions — Volume 1

| Faixa | Categoria | Duração |
| --- | --- | --- |
| Noite entre Commits | Lo-fi & Focus | 3:00 |
| Jardim ao Amanhecer | Ambient & Zen | 3:00 |
| Caminho da Floresta | Ambient & Zen | 3:00 |
| Refúgio Zen | Ambient & Zen | 3:00 |

Quatro faixas distintas: dois arquivos Track 2 eram cópias binariamente idênticas e foram deduplicados.

O catálogo é definido em src/music.js. A branch de desenvolvimento contém o código e os caminhos esperados; os **MP3/JPG precisam ser enviados separadamente**. Não faça merge para produção até que os oito arquivos estejam presentes em audio/ e covers/. Veja docs/IMPORTAR_MIDIAS.md.

## Funcionalidades

- Categorias próprias, capas individuais e catálogo sem APIs externas.
- Reprodução real de MP3 com HTMLAudioElement, play/pausa, anterior/próxima, shuffle, repeat, seek, mute e avanço automático.
- Metadados ID3 dos MP3s: artista e produção vlimap, álbum Foco.dev Sessions Vol. 1.
- Playlists pessoais no armazenamento local e links para compartilhar cópias sem autenticação.
- Importação opcional de áudios pessoais, mantidos exclusivamente no IndexedDB do navegador.
- Barra mobile fixa, Bootstrap Icons, temas, alto contraste, ampliação de texto e VLibras oficial.

## Publicação estática

No Windows 11, execute na raiz do clone:

~~~powershell
npm test
npm run check
npx serve .
~~~

Vercel: framework Other, sem build e sem backend. Os arquivos MP3 publicados em audio/ serão servidos estaticamente a partir do mesmo domínio.

## Direitos e rastreabilidade

Mantenha os WAVs masters, prompts, histórico da ferramenta, condições da licença na data de criação e os hashes SHA-256 registrados no pacote. O fato de uma música ser gerada por IA não garante exclusividade sobre a composição. Confirme que a assinatura e os termos do Adobe Firefly autorizam o uso específico de publicação como gravação independente em player público.

Não é possível impedir tecnicamente o download de MP3s enviados para navegadores em um site público. Não utilizamos DRM; avisos e metadados ID3 são medidas de atribuição, não mecanismos anticópia.

Referências: docs/POLITICA_DE_MIDIAS.md e docs/IMPORTAR_MIDIAS.md.

# Arquitetura: catálogo autoral

- Música publicada: arquivos estáticos em /audio/*.mp3, capas em /covers/*.jpg.
- Catálogo e categorias: constantes imutáveis em src/music.js, creditadas a vlimap.
- Reprodução: elemento HTMLAudioElement, sem endpoints de terceiros.
- MP3: metadados ID3 com título e produção.
- Playlists sem login: localStorage e compartilhamento por fragmento hash na URL.
- Arquivos privados trazidos pelo usuário: IndexedDB, somente no dispositivo.
- Deploy: Vercel estático; sem banco de dados e sem funções serverless.
- Acessibilidade: VLibras oficial, navegação por teclado, temas e contraste.
- Não há DRM. Distribuir MP3s publicamente requer direitos de uso apropriados.

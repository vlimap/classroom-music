# Publicação das quatro gravações Foco.dev Sessions

O pacote gerado nesta conversa, **foco-dev-audios-e-capas.zip**, contém as versões MP3 otimizadas dos WAVs recebidos e quatro capas JPG sem texto.

O GitHub foi atualizado com catálogo e reprodutor em uma branch separada, mas a integração disponível não aceita upload direto dos arquivos binários gerados. **Os MP3/JPG ainda não estão no repositório.**

## Estrutura exigida na raiz do repositório

~~~text
audio/
  noite-entre-commits.mp3
  jardim-ao-amanhecer.mp3
  caminho-da-floresta.mp3
  refugio-zen.mp3
covers/
  noite-entre-commits.jpg
  jardim-ao-amanhecer.jpg
  caminho-da-floresta.jpg
  refugio-zen.jpg
~~~

## Envio via PowerShell no Windows 11

~~~powershell
git clone https://github.com/vlimap/classroom-music.git
cd classroom-music
git switch feat/vlimap-firefly-catalog
# Extraia o ZIP e copie as pastas audio e covers para esta pasta
git add audio covers
git commit -m "feat(media): add Firefly recordings and individual covers"
git push -u origin feat/vlimap-firefly-catalog
~~~

Alternativamente, use GitHub → branch feat/vlimap-firefly-catalog → Add file → Upload files, mantendo os caminhos de pasta.

Execute npm test e npm run check. Depois teste reprodução, seek e avanço automático na prévia e faça o merge da PR.

## Cuidados

- Os WAVs originais (~33 MB cada) permanecem como matrizes, fora do GitHub. Os MP3s estão na faixa de 3 a 4 MB cada.
- O pacote contém um catálogo JSON e SHA-256 de cada arquivo para auditoria.
- O host Vercel contabilizará tráfego dos arquivos; verifique suas cotas antes de divulgar amplamente.
- O compartilhamento de playlists salva nomes e identificadores, não os bytes dos MP3s.
- Confira a licença de geração da Adobe para publicação de áudio no contexto do Foco.dev.

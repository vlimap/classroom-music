// Podcast editorial: nenhum conteúdo publicado automaticamente ou criado por APIs externas.
// Áudio somente quando for exportado pelo responsável e enviado ao diretório indicado.
export const PODCAST_EPISODES = Object.freeze([
  Object.freeze({
    id: "focodev-news-2026-11-14",
    type: "podcast",
    source: "published",
    categoryId: "podcasts",
    title: "Foco.dev News — 14 de novembro de 2026",
    shortTitle: "Notícias de tecnologia — 14/11",
    date: "2026-11-14",
    description: "Segurança em extensões, servidores IRC, privacidade e infraestrutura crítica.",
    artist: "vlimap",
    producer: "vlimap",
    generatedWith: "Adobe Podcast (locução e transcrição fornecidas pelo produtor)",
    artwork: "/covers/categories/podcasts.svg",
    audio: "/audio/podcasts/focodev-news-2026-11-14.mp3",
    duration: 0, // atualizado com loadedmetadata após o envio do áudio
    transcript: "/content/podcasts/2026-11-14-transcricao-adobe.txt",
    transcriptReviewed: false,
    sourceLinks: Object.freeze([
      { publisher: "BleepingComputer", label: "Cursor e extensão Claude Code", url: "https://www.bleepingcomputer.com/news/security/cursor-confirms-security-breach-led-to-malicious-claude-code-extension/" },
      { publisher: "The Hacker News", label: "Vulnerabilidade UnrealIRCd", url: "https://thehackernews.com/2026/11/attackers-exploit-unrealircd-flaw-that.html" },
      { publisher: "SecurityWeek", label: "Arquitetura Secure Exclaves da Apple", url: "https://www.securityweek.com/apple-reveals-how-secure-exclaves-shield-camera-and-microphone-data/" },
      { publisher: "Reuters", label: "Falha de comunicação na aviação dos EUA", url: "https://www.reuters.com/business/aerospace-defense/us-aviation-shutdown-blamed-l3-harris-installed-router-2026-11-14/" },
      { publisher: "SecurityWeek", label: "Investigação da interrupção da FAA", url: "https://www.securityweek.com/no-signs-of-hacking-in-faa-ground-stop-as-fbi-reportedly-probes-software-update/" },
      { publisher: "BleepingComputer", label: "Operação FaceStealer", url: "https://www.bleepingcomputer.com/news/security/us-disrupts-north-korean-campaign-behind-400-million-crypto-theft/" }
    ])
  })
]);
export const getPodcast = id => PODCAST_EPISODES.find(episode => episode.id === id) ?? null;

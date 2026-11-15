// Links compartilháveis sempre apontam para a versão pública indexável,
// mesmo quando a interface está em um preview da Vercel.
export const PODCAST_SITE_URL = "https://classroommusic.vercel.app";
export function getEpisodeShareUrl(episodeId) {
  return PODCAST_SITE_URL + "/podcasts/" + encodeURIComponent(episodeId);
}

export async function sharePodcast(episode, announce = () => {}) {
  const url = getEpisodeShareUrl(episode.id);
  const payload = {
    title: episode.title + " | Foco.dev",
    text: episode.description,
    url
  };

  if (typeof navigator.share === "function") {
    try {
      await navigator.share(payload);
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
      // Falha no compartilhamento nativo: usa cópia de link como alternativa.
    }
  }
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      announce("Link do episódio copiado para compartilhar.");
      return;
    } catch {
      // Pode falhar em navegadores que bloqueiam clipboard.
    }
  }
  if (typeof window.prompt === "function") {
    window.prompt("Copie o link do episódio:", url);
  } else {
    announce("Não foi possível copiar o link automaticamente.");
  }
}

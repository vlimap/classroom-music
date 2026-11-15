// Busca editorial compartilhada, sem dependências ou consultas externas.
export function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

export function filterPodcastEpisodes(episodes, query) {
  const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return episodes;

  return episodes.filter(episode => {
    const searchableText = normalizeSearchText([
      episode.title, episode.description, episode.summary,
      episode.date, episode.artist, episode.categoryId
    ].filter(Boolean).join(" "));
    return terms.every(term => searchableText.includes(term));
  });
}

// Ordenação local por engajamento agregado: uma curtida e um ouvinte
// contabilizado têm o mesmo peso. Não altera o catálogo nem grava no Redis.
const validCount = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;

/**
 * Prioriza maior total de interações; desempata por ouvintes e depois curtidas.
 * Sem métricas disponíveis ou em igualdade, preserva a ordem editorial.
 * Não modifica o array recebido.
 */
export function sortPodcastsByEngagement(episodes, getSnapshot) {
  return episodes.map((episode, originalIndex) => {
    const stats = getSnapshot(episode.id) || {};
    return {
      episode,
      originalIndex,
      likes: validCount(stats.likes),
      listeners: validCount(stats.listeners)
    };
  }).sort((a, b) =>
    (b.likes + b.listeners) - (a.likes + a.listeners) ||
    b.listeners - a.listeners ||
    b.likes - a.likes ||
    a.originalIndex - b.originalIndex
  ).map(({ episode }) => episode);
}

/**
 * Apenas move os nós existentes para preservar listeners e estado dos botões;
 * não reconstitui os cards durante atualizações de curtidas ou ouvintes.
 */
export function reorderPodcastCards(container, sortedEpisodes) {
  if (!container) return;
  const cardsById = new Map(
    Array.from(container.children, card => [card.dataset.podcastId, card])
  );

  let position = 0;
  for (const episode of sortedEpisodes) {
    const card = cardsById.get(episode.id);
    if (!card) continue;
    if (container.children[position] !== card) {
      container.insertBefore(card, container.children[position] ?? null);
    }
    position++;
  }
}

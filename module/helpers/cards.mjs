/**
 * @param {Card} card
 * @return number
 */
export function getValueForGm(card) {
  return card.value;
}

/**
 * @param {Card} card
 * @return number
 */
export function getValueForAgent(card) {
  return card.showFace ? card.value : 0;
}

/**
 * @param {Collection<Card>} cards
 * @returns number
 */
export function scoreForAgent(cards) {
  return cards.reduce((acc, card) => {
    return acc + getValueForAgent(card);
  }, 0);
}

/**
 * @param {Collection<Card>} cards
 * @returns number
 */
export function scoreForGM(cards) {
  return cards.reduce((acc, card) => {
    return acc + getValueForGm(card);
  }, 0);
}

/**
 * @param {Collection<Card>} cards
 * @returns {Card[]}
 */
export function sortByValue(cards) {
  return cards.contents.sort((a, b) => {
    return getValueForGm(a) - getValueForGm(b);
  });
}

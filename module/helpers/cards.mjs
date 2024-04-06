export const BLACKJACK_SCORE = 21;

/**
 * @param {Card} card
 * @return number
 */
export function getValueForJack(card) {
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
export function scoreForJack(cards) {
  return cards.reduce((acc, card) => {
    return acc + getValueForJack(card);
  }, 0);
}

/**
 * @param {Collection<Card>} cards
 * @returns {Card[]}
 */
export function sortByValue(cards) {
  return cards.contents.sort((a, b) => {
    return getValueForJack(a) - getValueForJack(b);
  });
}

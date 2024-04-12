export const BLACKJACK_SCORE = 21;

/**
 * A simple representation of a card.
 * @typedef {Object} SimpleCard
 * @property {number} id
 * @property {string} name
 * @property {number} value
 * @property {string} back
 * @property {string} front
 * @property {boolean} visible
 * @property {boolean} excluded
 */

/**
 * @param {Card[]} cards
 * @return SimpleCard[]
 */
export function simpleClone(cards) {
  return cards.map(card => ({
    id: card.id,
    name: card.faces[0].name,
    value: card.value,
    front: card.faces[0].img,
    back: card.back.img,
    visible: null !== card.face,
    excluded: false,
  }));
}

/**
 * @param {SimpleCard} card
 * @return number
 */
export function getValueForJack(card) {
  return !card.excluded ? card.value : 0;
}

/**
 * @param {SimpleCard} card
 * @return number
 */
export function getValueForAgent(card) {
  return !card.excluded && card.visible ? card.value : 0;
}

/**
 * @param {SimpleCard[]} cards
 * @returns number
 */
export function scoreForAgent(cards) {
  return cards.reduce((acc, card) => {
    return acc + getValueForAgent(card);
  }, 0);
}

/**
 * @param {SimpleCard[]} cards
 * @returns number
 */
export function scoreForJack(cards) {
  return cards.reduce((acc, card) => {
    return acc + getValueForJack(card);
  }, 0);
}

/**
 * @param {Card[]} cards
 * @returns {Card[]}
 */
export function sortByValue(cards) {
  return cards.sort((a, b) => {
    return getValueForJack(a) - getValueForJack(b);
  });
}

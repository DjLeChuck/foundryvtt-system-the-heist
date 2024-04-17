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
 * @property {string} suit
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
    suit: card.suit,
  }));
}

/**
 * @param {SimpleCard[]} cards
 * @returns number
 */
export function scoreForAgent(cards) {
  const score = cards.reduce((acc, card) => {
    return acc + _getValueForAgent(card);
  }, 0);

  return includesJoker(cards) ? score * 2 : score;
}

/**
 * @param {SimpleCard[]} cards
 * @returns number
 */
export function scoreForJack(cards) {
  const score = cards.reduce((acc, card) => {
    return acc + _getValueForJack(card);
  }, 0);

  return includesJoker(cards) ? score * 2 : score;
}

/**
 * @param {Card[]} cards
 * @returns {Card[]}
 */
export function sortByValue(cards) {
  return cards.sort((a, b) => {
    return _getValueForJack(a) - _getValueForJack(b);
  });
}

/**
 * @param {SimpleCard[]} cards
 * @return {boolean}
 */
export function includesJoker(cards) {
  return -1 !== cards.findIndex((card) => 'jokers' === card.suit);
}

export function getJokerData(position) {
  return {
    name: 'Joker',
    faces: [
      {
        name: 'Joker',
        img: 'cards/dark-gold/joker.webp',
      },
    ],
    type: 'base',
    value: 0,
    face: 0,
    suit: 'jokers',
    sort: position - 2, // -> index 0 and card already same position
  };
}

/**
 * @param {SimpleCard} card
 * @return number
 */
function _getValueForJack(card) {
  return !card.excluded ? card.value : 0;
}

/**
 * @param {SimpleCard} card
 * @return number
 */
function _getValueForAgent(card) {
  return !card.excluded && card.visible ? card.value : 0;
}

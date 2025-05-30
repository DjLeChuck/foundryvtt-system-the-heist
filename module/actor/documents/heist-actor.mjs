import { BaseActor } from './base-actor.mjs';
import * as HEIST from '../../const.mjs';
import * as CARDS from '../../helpers/cards.mjs';
import { getJokerData } from '../../helpers/cards.mjs';

/**
 * Joker’s configuration for a phase.
 * @typedef {Object} JokerPhaseConfiguration
 * @property {number} numberOfPile
 * @property {number} firstJokerPile
 * @property {number} secondJokerPile
 */

export class HeistActor extends BaseActor {
  constructor(docData, context = {}) {
    super(docData, context);

    if (docData._id) {
      Hooks.on(`${HEIST.SYSTEM_ID}.changeGamePhase`, (phase) => this.#onChangeGamePhase(phase));
    }
  }

  /**
   * @returns {Cards|null}
   */
  get jackDeck() {
    return game.cards.get(this.system.jack.deck);
  }

  /**
   * @returns {Cards|null}
   */
  get jackPile() {
    return game.cards.get(this.system.jack.pile);
  }

  /**
   * @returns {Cards|null}
   */
  get jackTestHand() {
    return game.cards.get(this.system.jack.testHand);
  }

  /**
   * @returns {Cards|null}
   */
  get jackReconnaissanceHand() {
    return game.cards.get(this.system.jack.reconnaissanceHand);
  }

  get jackCanDraw() {
    return this.jackDeck?.availableCards.length > 0;
  }

  get jackCanAskTest() {
    return this.jackDeck?.availableCards.length >= 3;
  }

  /**
   * @returns {AgentActor}
   */
  get spade() {
    if (!this.system.spade) {
      return null;
    }

    return game.actors.get(this.system.spade);
  }

  /**
   * @returns {AgentActor}
   */
  get heart() {
    if (!this.system.heart) {
      return null;
    }

    return game.actors.get(this.system.heart);
  }

  /**
   * @returns {AgentActor}
   */
  get diamond() {
    if (!this.system.diamond) {
      return null;
    }

    return game.actors.get(this.system.diamond);
  }

  /**
   * @returns {AgentActor}
   */
  get club() {
    if (!this.system.club) {
      return null;
    }

    return game.actors.get(this.system.club);
  }

  /**
   * @returns {AgentActor[]}
   */
  get agents() {
    return [this.club, this.heart, this.diamond, this.spade].filter(agent => null !== agent);
  }

  /**
   * @return {number}
   */
  get availableCredits() {
    return this.system.availableCredits + this.system.progression.budgetAugmentation;
  }

  get agentExtraSkills() {
    let extraSkills = 0;

    if (this.system.progression.firstAgentTraining) {
      extraSkills += 2;
    }

    if (this.system.progression.secondJoker) {
      extraSkills += 2;
    }

    if (this.system.progression.thirdAgentTraining) {
      extraSkills += 2;
    }

    return extraSkills;
  }

  /**
   * @return {Card[]}
   */
  get jackJokers() {
    return this.jackDeck.availableCards.filter((card) => 'jokers' === card.suit);
  }

  /**
   * @param {Cards} hand
   * @param {number} number
   * @returns {Promise<Card[]>}
   */
  async jackDrawCards(hand, number) {
    const cards = await hand.draw(this.jackDeck, number, { chatNotification: false });

    this.render(false);

    return cards;
  }

  /**
   * @param {Cards} hand
   * @param {number} jokerNumber
   * @returns {Promise<Card|null>}
   */
  async jackDrawJoker(hand, jokerNumber) {
    const jokers = this.jackJokers;
    if (!jokers[jokerNumber]) {
      return null;
    }

    const card = await this.jackDeck.pass(hand, [jokers[jokerNumber].id], { chatNotification: false });

    this.render(false);

    return card[0];
  }

  async jackThrowTestHand() {
    await this.#throwHand(this.jackTestHand);
  }

  jackNextDrawHasJoker() {
    const cards = this.jackDeck.cards.contents.sort(this.jackDeck.sortShuffled)
      .filter((card) => !card.drawn)
      .splice(0, 3);

    return CARDS.includesJoker(cards);
  }

  /** @override */
  async _preCreate(data, options, userId) {
    await super._preCreate(data, options, userId);

    await this.#createDecks();
  }

  async _onDelete(options, userId) {
    await this.#deleteDecks();

    super._onDelete(options, userId);
  }

  #baseDeck() {
    return game.packs.get(HEIST.COMPENDIUM_DECK_ID).getDocument(HEIST.JACK_DECK_ID);
  }

  async #createDeck() {
    const baseDeck = await this.#baseDeck();

    return await Cards.implementation.create(foundry.utils.mergeObject(baseDeck.toObject(false), {
      name: game.i18n.format('HEIST.Cards.DeckName', { name: this.name }),
      flags: {
        [HEIST.SYSTEM_ID]: {
          generated: true,
        },
      },
    }));
  }

  async #createPile() {
    return await Cards.implementation.create({
      name: game.i18n.format('HEIST.Cards.PileName', { name: this.name }),
      type: 'pile',
      flags: {
        [HEIST.SYSTEM_ID]: {
          generated: true,
        },
      },
    });
  }

  async #createHand(nameKey) {
    return await Cards.implementation.create({
      name: game.i18n.format(nameKey, { name: this.name }),
      type: 'hand',
      flags: {
        [HEIST.SYSTEM_ID]: {
          generated: true,
        },
      },
    });
  }

  async #createDecks() {
    const deck = await this.#createDeck();
    const pile = await this.#createPile();
    const testHand = await this.#createHand('HEIST.Cards.TestHandName');
    const reconnaissanceHand = await this.#createHand('HEIST.Cards.RecognitionHandName');

    // Shuffle the cloned deck
    await this.#shuffleDeck(deck);

    this.#saveCreatedDecks({
      deck: deck.id,
      pile: pile.id,
      testHand: testHand.id,
      reconnaissanceHand: reconnaissanceHand.id,
    });
  }

  #saveCreatedDecks(decks) {
    this.updateSource({
      system: { jack: { ...decks } },
    });
  }

  async #deleteDecks() {
    if (!game.users.activeGM) {
      return;
    }

    await this.jackDeck?.delete();
    await this.jackPile?.delete();
    await this.jackTestHand?.delete();
    await this.jackReconnaissanceHand?.delete();
  }

  async #onChangeGamePhase(phase) {
    await this.#removeJokers();

    if ([HEIST.GAME_PHASE_RECONNAISSANCE, HEIST.GAME_PHASE_ACTION].includes(phase.id)) {
      await this.#recallDeck();
      await this.#injectJokers(phase);
    }

    this.render(false);
  }

  async #throwHand(hand) {
    await hand.pass(this.jackPile, hand.cards.map((c) => c.id), { chatNotification: false });

    this.render(false);
  }

  async #shuffleDeck(deck) {
    await deck.shuffle({ chatNotification: false });
  }

  async #recallDeck() {
    await this.jackDeck?.recall({ chatNotification: false });
  }

  async #removeJokers() {
    if (!this.jackDeck) {
      return;
    }

    this.jackDeck.cards.forEach((card) => {
      if ('jokers' === card.suit) {
        card.delete();
      }
    });
  }

  async #injectJokers(phase) {
    /** @var JokerPhaseConfiguration|null */
    const config = this.system.jack.jokerPhasesConfigurations[phase.id] || null;
    if (null === config || 0 === config.numberOfPile) {
      return;
    }

    const positions = this.#calculateJokersPositions(this.jackDeck, config);
    const jokers = [];

    if (null !== positions.firstJoker) {
      jokers.push(getJokerData(positions.firstJoker));
    }

    if (null !== positions.secondJoker) {
      jokers.push(getJokerData(positions.secondJoker));
    }

    await this.jackDeck.createEmbeddedDocuments('Card', jokers, { renderSheet: false });
  }

  /**
   * @param {Cards} deck
   * @param {JokerPhaseConfiguration} config
   * @return {{firstJoker: number|null, secondJoker: number|null}}
   */
  #calculateJokersPositions(deck, config) {
    const availableCards = deck.availableCards.length;
    const cardsPerPile = availableCards / config.numberOfPile;

    const positions = {
      firstJoker: null,
      secondJoker: null,
    };

    if (0 < config.firstJokerPile) {
      const offsetFirstJoker = (config.firstJokerPile - 1) * cardsPerPile;
      positions.firstJoker = Math.floor(offsetFirstJoker + Math.random() * cardsPerPile);
    }

    if (0 < config.secondJokerPile) {
      const offsetSecondJoker = (config.secondJokerPile - 1) * cardsPerPile;
      positions.secondJoker = Math.floor(offsetSecondJoker + Math.random() * cardsPerPile);
    }

    return positions;
  }
}

import { BasePlayerActor } from './base-player-actor.mjs';
import * as HEIST from '../../const.mjs';

export class JackActor extends BasePlayerActor {
  constructor(docData, context = {}) {
    super(docData, context);

    if (docData._id) {
      Hooks.on(`${HEIST.SYSTEM_ID}.changeGamePhase`, (phase) => this.#onChangeGamePhase(phase));
    }
  }

  /**
   * @returns {Cards|null}
   */
  get testHand() {
    return game.cards.get(this.system.testHand);
  }

  /**
   * @returns {Cards|null}
   */
  get reconnaissanceHand() {
    return game.cards.get(this.system.reconnaissanceHand);
  }

  get canAskTest() {
    return this.deck?.availableCards.length >= 3;
  }

  /**
   * @param {Cards} hand
   * @param {number} number
   * @returns {Promise<Card[]>}
   */
  async drawCards(hand, number) {
    const cards = await hand.draw(this.deck, number, { chatNotification: false });

    this.render(false);

    return cards;
  }

  async throwTestHand() {
    await this.#throwHand(this.testHand);
  }

  /** @override */
  async _preCreate(data, options, userId) {
    await super._preCreate(data, options, userId);

    await this._createDecks();
  }

  _baseDeckId() {
    return HEIST.JACK_DECK_ID;
  }

  async _createDecks() {
    const deck = await this._createDeck();
    const pile = await this._createPile();
    const testHand = await Cards.create({
      name: game.i18n.format('HEIST.Cards.TestHandName', { name: this.name }),
      type: 'hand',
      flags: {
        [HEIST.SYSTEM_ID]: {
          generated: true,
        },
      },
    });
    const reconnaissanceHand = await Cards.create({
      name: game.i18n.format('HEIST.Cards.RecognitionHandName', { name: this.name }),
      type: 'hand',
      flags: {
        [HEIST.SYSTEM_ID]: {
          generated: true,
        },
      },
    });

    // Shuffle the cloned deck
    await this._shuffleDeck(deck);

    this._saveCreatedDecks({
      deck: deck.id,
      testHand: testHand.id,
      reconnaissanceHand: reconnaissanceHand.id,
      pile: pile.id,
    });
  }

  _saveCreatedDecks(decks) {
    this.updateSource({
      system: { ...decks },
    });
  }

  async _deleteDecks() {
    await super._deleteDecks();

    await this.testHand?.delete();
    await this.reconnaissanceHand?.delete();
  }

  async #throwHand(hand) {
    await hand.pass(this.pile, hand.cards.map((c) => c.id), { chatNotification: false });

    this.render(false);
  }

  async #onChangeGamePhase(phase) {
    if ([HEIST.GAME_PHASE_RECONNAISSANCE, HEIST.GAME_PHASE_ACTION].includes(phase.id)) {
      await this.#recallDeck();
    }

    this.render(false);
  }

  async #recallDeck() {
    await this.deck?.recall({ chatNotification: false });
  }
}

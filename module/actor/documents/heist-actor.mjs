import { BaseActor } from './base-actor.mjs';
import * as HEIST from '../../const.mjs';

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
   * @return {Number}
   */
  get availableCredits() {
    return this.system.availableCredits;
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

  async jackThrowTestHand() {
    await this.#throwHand(this.jackTestHand);
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

    return await Cards.create(foundry.utils.mergeObject(baseDeck.toObject(false), {
      name: game.i18n.format('HEIST.Cards.DeckName', { name: this.name }),
      flags: {
        [HEIST.SYSTEM_ID]: {
          generated: true,
        },
      },
    }));
  }

  async #createPile() {
    return await Cards.create({
      name: game.i18n.format('HEIST.Cards.PileName', { name: this.name }),
      type: 'pile',
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
    await this.jackDeck?.delete();
    await this.jackPile?.delete();
    await this.jackTestHand?.delete();
    await this.jackReconnaissanceHand?.delete();
  }

  async #onChangeGamePhase(phase) {
    if ([HEIST.GAME_PHASE_RECONNAISSANCE, HEIST.GAME_PHASE_ACTION].includes(phase.id)) {
      await this.#recallDeck();
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
    await this.deck?.recall({ chatNotification: false });
  }
}

import { BasePlayerActor } from './base-player-actor.mjs';
import * as HEIST from '../../const.mjs';
import * as CARDS from '../../helpers/cards.mjs';

export class JackActor extends BasePlayerActor {
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

  /**
   * @returns {AgentActor[]}
   */
  get agents() {
    const agents = [];

    for (const agentId of this.system.agents) {
      agents.push(game.actors.get(agentId));
    }

    return agents;
  }

  async drawCards(hand, number) {
    await hand.draw(this.deck, number, { chatNotification: false });

    this.render(false);
  }

  async throwTestHand() {
    await this.#throwHand(this.testHand);
  }

  async throwReconnaissanceHand() {
    await this.#throwHand(this.reconnaissanceHand);
  }

  /**
   * @param {String|undefined} difficulty
   * @param {String|undefined} agentId
   */
  async doAgentTest(difficulty, agentId) {
    if (!difficulty) {
      throw new Error('Missing difficulty for agent test.');
    }

    if (!agentId) {
      throw new Error('Missing agent ID for agent test.');
    }

    await game[HEIST.SYSTEM_ID].agentTestWindow.prepareTest(this.id, agentId);

    // Draw 3 cards
    await this.drawCards(this.testHand, 3);

    // Sort them by value
    const sortedCards = CARDS.sortByValue(this.testHand.cards);

    let removedCard;

    switch (difficulty) {
      case 'easy':
        // Hide "easy" card
        await sortedCards[0].flip(null);

        // Remove the last card
        removedCard = sortedCards[2].id;

        break;
      case 'difficult':
        // Hide "difficult" card
        await sortedCards[2].flip(null);

        // Remove the first card
        removedCard = sortedCards[0].id;

        break;
      default:
        throw new Error(`Unknown difficulty "${difficulty}"`);
    }

    // Remove the unwanted card
    await this.testHand.pass(this.pile, [removedCard], { chatNotification: false });

    game[HEIST.SYSTEM_ID].agentTestWindow.render(true);
  }

  async revealTest() {
    for (const card of this.testHand.cards.contents) {
      await card.flip(0);
    }
  }

  async recallDeck() {
    await this.deck?.recall({ chatNotification: false });
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
    await deck.shuffle({ chatNotification: false });

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
}

import { BaseActor } from './base-actor.mjs';
import * as HEIST from '../../const.mjs';

export class AgentActor extends BaseActor {
  /**
   * @returns {Cards|null}
   */
  get deck() {
    if (!this.system.deck) {
      return null;
    }

    return game.cards.get(this.system.deck);
  }

  /**
   * @returns {Cards|null}
   */
  get pile() {
    if (!this.system.pile) {
      return null;
    }

    return game.cards.get(this.system.pile);
  }

  /**
   * @returns {Cards|null}
   */
  get hand() {
    return game.cards.get(this.system.hand);
  }

  /**
   * @returns {HeistActor|null}
   */
  get agency() {
    if (!this.system.agency) {
      return null;
    }

    return game.actors.get(this.system.agency);
  }

  /**
   * @returns {AgentTypeItem|null}
   */
  get agentType() {
    return this.items.find((item) => 'agentType' === item.type) ?? null;
  }

  /**
   * @returns {FetishItem|null}
   */
  get fetish() {
    return this.items.find((item) => 'fetish' === item.type) ?? null;
  }

  /**
   * @returns {SkillItem[]}
   */
  get skills() {
    return this.items.filter((item) => 'skill' === item.type);
  }

  get canUseFetish() {
    return this.fetish && !this.fetishUsed;
  }

  get fetishUsed() {
    return this.system.fetishUsed;
  }

  get canLearnSkill() {
    return this.#maxSkills > this.skills.length;
  }

  get canDraw() {
    return 0 < this.deck.availableCards.length;
  }

  /**
   * @return {boolean}
   */
  get isDead() {
    return this.system.dead;
  }

  /**
   * @return {boolean}
   */
  get canBeTested() {
    return !this.isDead && this.canDraw;
  }

  get #maxSkills() {
    return 2 + (this.agency?.agentExtraSkills || 0);
  }

  /**
   * @param {number} number
   * @returns {Promise<Card[]>}
   */
  async drawCards(number) {
    const cards = await this.hand.draw(this.deck, number, { chatNotification: false });

    this.render(false);

    return cards;
  }

  async throwHand() {
    await this.hand.pass(this.pile, this.hand.cards.map((c) => c.id), { chatNotification: false });

    this.render(false);
  }

  async useFetish() {
    if (!this.fetish) {
      ui.notifications.error(game.i18n.localize('HEIST.Errors.NoFetishObject'));

      return;
    }

    await this.update({ 'system.fetishUsed': true });
  }

  async toggleFetish() {
    if (!this.fetish) {
      ui.notifications.error(game.i18n.localize('HEIST.Errors.NoFetishObject'));

      return;
    }

    await this.update({ 'system.fetishUsed': !this.system.fetishUsed });
  }

  async setDecks() {
    await this.#deleteDecks();
    await this.#createDecks();
  }

  async recallHand() {
    const ids = this.hand.cards.map((c) => c.id);

    if (!ids.length) {
      return 0;
    }

    await this.hand.pass(this.deck, ids, { chatNotification: false });

    await this.#shuffleDeck(this.deck);

    return ids.length;
  }

  async recallFromPile(number) {
    const toRecall = Math.min(number, this.pile.availableCards.length);

    if (0 === toRecall) {
      return 0;
    }

    await this.#recallCards(this.pile, this.deck, toRecall);

    return toRecall;
  }

  /**
   * @return {Promise<number|null>}
   */
  async harm() {
    const toRecall = Math.ceil(this.deck.availableCards.length / 2);

    if (0 >= toRecall) {
      return null;
    }

    await this.#recallCards(this.deck, this.pile, toRecall);

    return toRecall;
  }

  async kill() {
    await this.update({ 'system.dead': true });
  }

  async resurrect() {
    await this.update({ 'system.dead': false });
  }

  async rescue() {
    await this.#recallCards(this.deck, this.pile, this.deck.availableCards.length);
  }

  async _onDelete(options, userId) {
    await this.#deleteDecks();

    super._onDelete(options, userId);
  }

  async #createDecks() {
    const deck = await this.#createDeck();
    const pile = await this.#createPile();
    const hand = await Cards.create({
      name: game.i18n.format('HEIST.Cards.HandName', { name: this.name }),
      type: 'hand',
      flags: {
        [HEIST.SYSTEM_ID]: {
          generated: true,
        },
      },
    });

    // Shuffle the cloned deck
    await this.#shuffleDeck(deck);

    await this.#saveCreatedDecks({ deck: deck.id, hand: hand.id, pile: pile.id });
  }

  async #saveCreatedDecks(decks) {
    await this.update({
      system: { ...decks },
    });
  }

  async #deleteDecks() {
    await this.deck?.delete();
    await this.pile?.delete();
    await this.hand?.delete();
  }

  #baseDeckId() {
    if (null === this.agentType || !this.agentType.system?.deckId) {
      ui.notifications.error(game.i18n.format('HEIST.Errors.DeckIdNotSet'));

      return null;
    }

    return this.agentType.system.deckId;
  }

  #baseDeck() {
    return game.packs.get(HEIST.COMPENDIUM_DECK_ID).getDocument(this.#baseDeckId());
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

  async #shuffleDeck(deck) {
    await deck.shuffle({ chatNotification: false });
  }

  async #recallCards(from, to, number) {
    await to.draw(from, number, {
      how: CONST.CARD_DRAW_MODES.RANDOM,
      chatNotification: false,
    });

    await this.#shuffleDeck(to);
  }
}

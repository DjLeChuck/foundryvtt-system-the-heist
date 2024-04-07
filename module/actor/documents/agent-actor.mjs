import { BasePlayerActor } from './base-player-actor.mjs';
import * as HEIST from '../../const.mjs';

export class AgentActor extends BasePlayerActor {
  /**
   * @returns {Cards|null}
   */
  get hand() {
    return game.cards.get(this.system.hand);
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
    return this.fetish && !this.fetish.isUsed;
  }

  get canLearnSkill() {
    // @todo Gérer la progression « Entraînement des agents »
    return 2 > this.skills.length;
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

  async drawCards(number) {
    await this.hand.draw(this.deck, number, { chatNotification: false });

    this.render(false);
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

    await this.fetish.update({ 'system.used': true });
  }

  async toggleFetish() {
    if (!this.fetish) {
      ui.notifications.error(game.i18n.localize('HEIST.Errors.NoFetishObject'));

      return;
    }

    await this.fetish.toggleUsage();
  }

  async setDecks() {
    await this._deleteDecks();
    await this._createDecks();
  }

  async recallHand() {
    const ids = this.hand.cards.map((c) => c.id);

    if (!ids.length) {
      return 0;
    }

    await this.hand.pass(this.deck, ids, { chatNotification: false });

    await this._shuffleDeck(this.deck);

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

  async rescue() {
    await this.#recallCards(this.deck, this.pile, this.deck.availableCards.length);
  }

  _baseDeckId() {
    if (null === this.agentType || !this.agentType.system?.deckId) {
      ui.notifications.error(game.i18n.format('HEIST.Errors.DeckIdNotSet'));

      return null;
    }

    return this.agentType.system.deckId;
  }

  async _createDecks() {
    const deck = await this._createDeck();
    const pile = await this._createPile();
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
    await this._shuffleDeck(deck);

    this._saveCreatedDecks({ deck: deck.id, hand: hand.id, pile: pile.id });
  }

  async _saveCreatedDecks(decks) {
    await this.update({
      system: { ...decks },
    });
  }

  async _deleteDecks() {
    await super._deleteDecks();

    await this.hand?.delete();
  }

  async #recallCards(from, to, number) {
    await to.draw(from, number, {
      how: CONST.CARD_DRAW_MODES.RANDOM,
      chatNotification: false,
    });

    await this._shuffleDeck(to);
  }
}

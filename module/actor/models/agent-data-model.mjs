import * as HEIST from '../../const.mjs';

export class AgentDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      description: new fields.HTMLField(),
      deck: new fields.DocumentIdField({
        required: false,
      }),
      pile: new fields.DocumentIdField({
        required: false,
      }),
      hand: new fields.DocumentIdField({
        required: false,
      }),
      agency: new fields.DocumentIdField({
        required: false,
      }),
      dead: new fields.BooleanField(),
      fetishUsed: new fields.BooleanField(),
    };
  }

  /**
   * @returns {Cards|null}
   */
  get deckDocument() {
    if (!this.deck) {
      return null;
    }

    return game.cards.get(this.deck);
  }

  /**
   * @returns {Cards|null}
   */
  get pileDocument() {
    if (!this.pile) {
      return null;
    }

    return game.cards.get(this.pile);
  }

  /**
   * @returns {Cards|null}
   */
  get handDocument() {
    return game.cards.get(this.hand);
  }

  /**
   * @returns {HeistActor|null}
   */
  get agencyDocument() {
    if (!this.agency) {
      return null;
    }

    return game.actors.get(this.agency);
  }

  /**
   * @returns {HeistItem|null}
   */
  get agentType() {
    return this.parent.items.find((item) => 'agentType' === item.type) ?? null;
  }

  /**
   * @returns {HeistItem|null}
   */
  get fetish() {
    return this.parent.items.find((item) => 'fetish' === item.type) ?? null;
  }

  /**
   * @returns {HeistItem[]}
   */
  get skills() {
    return this.parent.items.filter((item) => 'skill' === item.type);
  }

  get canUseFetish() {
    return null !== this.fetish && !this.fetishUsed;
  }

  get canLearnSkill() {
    return this.#maxSkills > this.skills.length;
  }

  get canDraw() {
    return 0 < this.deckDocument?.availableCards.length;
  }

  /**
   * @return {Boolean}
   */
  get isDead() {
    return this.dead;
  }

  /**
   * @return {Boolean}
   */
  get canBeTested() {
    return !this.isDead && this.canDraw;
  }

  get #maxSkills() {
    return 2 + (this.agencyDocument?.agentExtraSkills || 0);
  }

  /**
   * @param {Number} number
   * @returns {Promise<Card[]>}
   */
  async drawCards(number) {
    const cards = await this.handDocument?.draw(this.deck, number, { chatNotification: false });

    this.render(false);

    return cards;
  }

  async throwHand() {
    await this.handDocument?.pass(this.pileDocument, this.handDocument?.cards.map((c) => c.id), { chatNotification: false });

    this.render(false);
  }

  async useFetish() {
    if (!this.fetish) {
      ui.notifications.error(game.i18n.localize('HEIST.Errors.NoFetishObject'));

      return;
    }

    await this.parent.update({ 'system.fetishUsed': true });
  }

  async recallHand() {
    const ids = this.handDocument?.cards.map((c) => c.id);

    if (!ids.length) {
      return 0;
    }

    await this.handDocument?.pass(this.deckDocument, ids, { chatNotification: false });

    await this.#shuffleDeck(this.deckDocument);

    return ids.length;
  }

  async recallFromPile(number) {
    const toRecall = Math.min(number, this.pileDocument?.availableCards.length);

    if (0 === toRecall) {
      return 0;
    }

    await this.#recallCards(this.pileDocument, this.deckDocument, toRecall);

    return toRecall;
  }

  /**
   * @return {Promise<number|null>}
   */
  async harm() {
    const toRecall = Math.ceil(this.deckDocument?.availableCards.length / 2);

    if (0 >= toRecall) {
      return null;
    }

    await this.#recallCards(this.deckDocument, this.pileDocument, toRecall);

    return toRecall;
  }

  async kill() {
    await this.parent.update({ 'system.dead': true });
  }

  async resurrect() {
    await this.parent.update({ 'system.dead': false });
  }

  async rescue() {
    await this.#recallCards(this.deckDocument, this.pileDocument, this.deckDocument?.availableCards.length);
  }

  async _onCreate(data, options, userId) {
    if (userId !== game.user.id) {
      return;
    }

    if (null !== this.agentType) {
      await this.#setDecks();
    }
  }

  async _onUpdate(data, options, userId) {
    if (data.ownership && game.user === game.users.activeGM) {
      await this.#setCardsOwnership(data.ownership);
    }
  }

  async _onDelete(options, userId) {
    await this.#deleteDecks();
  }

  async #setCardsOwnership(ownership) {
    // Get only entries for owners, and set them to observer
    const filteredOwnerships = Object.fromEntries(
      Object.entries(ownership)
        .filter(([_, value]) => value === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
        .map(([key, value]) => [key, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER])
    );

    this.handDocument?.update({ ownership: filteredOwnerships }, { diff: false, recursive: false });
    this.pileDocument?.update({ ownership: filteredOwnerships }, { diff: false, recursive: false });
  }

  async #setDecks() {
    if (game.user !== game.users.activeGM) {
      return;
    }

    await this.#deleteDecks();
    await this.#createDecks();
  }

  async #createDecks() {
    if (!game.users.activeGM) {
      return;
    }

    const deck = await this.#createDeck();
    const pile = await this.#createPile();
    const hand = await this.#createHand();

    // Shuffle the cloned deck
    await deck.shuffle({ chatNotification: false });

    await this.#saveCreatedDecks({ deck, hand, pile });
  }

  #baseDeckId() {
    if (!this.agentType?.system?.deckId) {
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

    return await Cards.implementation.create(foundry.utils.mergeObject(baseDeck.toObject(false), {
      name: game.i18n.format('HEIST.Cards.DeckName', { name: this.parent.name }),
      flags: {
        [HEIST.SYSTEM_ID]: {
          generated: true,
        },
      },
    }));
  }

  async #createPile() {
    return await Cards.implementation.create({
      name: game.i18n.format('HEIST.Cards.PileName', { name: this.parent.name }),
      type: 'pile',
      flags: {
        [HEIST.SYSTEM_ID]: {
          generated: true,
        },
      },
    });
  }

  async #createHand() {
    return await Cards.implementation.create({
      name: game.i18n.format('HEIST.Cards.HandName', { name: this.parent.name }),
      type: 'hand',
      flags: {
        [HEIST.SYSTEM_ID]: {
          generated: true,
        },
      },
    });
  }

  async #saveCreatedDecks(decks) {
    await this.parent.update({
      system: { ...decks },
    });
  }

  async #deleteDecks() {
    if (!game.users.activeGM) {
      return;
    }

    await this.deckDocument?.delete();
    await this.pileDocument?.delete();
    await this.handDocument?.delete();
  }

  async #recallCards(from, to, number) {
    await to.draw(from, number, {
      how: CONST.CARD_DRAW_MODES.RANDOM,
      chatNotification: false,
    });

    await this.#shuffleDeck(to);
  }

  async #shuffleDeck(deck) {
    await deck.shuffle({ chatNotification: false });
  }
}

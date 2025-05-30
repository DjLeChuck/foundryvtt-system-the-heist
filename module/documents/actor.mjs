import * as HEIST from '../const.mjs';

export default class HeistActor extends foundry.documents.Actor {
  async setDecks() {
    if ('agent' !== this.type) {
      ui.notifications.error('Only agents can set decks.');
    }

    if (game.user !== game.users.activeGM) {
      return;
    }

    await this.#deleteDecks();
    await this.#createDecks();
  }

  async _onCreate(data, options, userId) {
    await super._onCreate(data, options, userId);

    if ('agent' === this.type) {
      await this.#onCreateAgent(userId);
    }
  }

  async _onUpdate(data, options, userId) {
    super._onUpdate(data, options, userId);

    if ('agent' === this.type) {
      await this.#onUpdateAgent(data);
    }
  }

  async _onDelete(options, userId) {
    if ('agent' === this.type) {
      await this.#onDeleteAgent();
    }

    super._onDelete(options, userId);
  }

  async #onCreateAgent(userId) {
    if (userId !== game.user.id) {
      return;
    }

    if (null !== this.system.agentType) {
      await this.setDecks();
    }
  }

  async #onUpdateAgent(data) {
    if (data.ownership && game.user === game.users.activeGM) {
      await this.#setCardsOwnership(data.ownership);
    }
  }

  async #onDeleteAgent() {
    await this.#deleteDecks();
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

    await this.#saveCreatedDecks({ deck: deck.id, hand: hand.id, pile: pile.id });
  }

  async #deleteDecks() {
    if (!game.users.activeGM) {
      return;
    }

    await this.system.deckDocument?.delete();
    await this.system.pileDocument?.delete();
    await this.system.handDocument?.delete();
  }

  async #saveCreatedDecks(decks) {
    await this.update({
      system: { ...decks },
    });
  }

  #baseDeckId() {
    if (null === this.system.agentType || !this.system.agentType.system?.deckId) {
      ui.notifications.error(game.i18n.format('HEIST.Errors.DeckIdNotSet'));

      return null;
    }

    return this.system.agentType.system.deckId;
  }

  #baseDeck() {
    return game.packs.get(HEIST.COMPENDIUM_DECK_ID).getDocument(this.#baseDeckId());
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

  async #createHand() {
    return await Cards.implementation.create({
      name: game.i18n.format('HEIST.Cards.HandName', { name: this.name }),
      type: 'hand',
      flags: {
        [HEIST.SYSTEM_ID]: {
          generated: true,
        },
      },
    });
  }

  async #setCardsOwnership(ownership) {
    // Get only entries for owners, and set them to observer
    const filteredOwnerships = Object.fromEntries(
      Object.entries(ownership)
        .filter(([_, value]) => value === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
        .map(([key, value]) => [key, CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER])
    );

    this.system.handDocument?.update({ ownership: filteredOwnerships }, { diff: false, recursive: false });
    this.system.pileDocument?.update({ ownership: filteredOwnerships }, { diff: false, recursive: false });
  }
}

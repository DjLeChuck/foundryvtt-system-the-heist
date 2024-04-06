import { BaseActor } from './base-actor.mjs';
import * as HEIST from '../../const.mjs';

export class BasePlayerActor extends BaseActor {
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
   * @returns {HeistActor|null}
   */
  get agency() {
    if (!this.system.agency) {
      return null;
    }

    return game.actors.get(this.system.agency);
  }

  /**
   * @return string
   *
   * @abstract
   */
  _baseDeckId() {
    throw new Error('You have to implement the method _baseDeckId!');
  }

  /**
   * @abstract
   */
  _saveCreatedDecks(decks) {
    throw new Error('You have to implement the method _saveCreatedDecks!');
  }

  async _onDelete(options, userId) {
    await this._deleteDecks();

    super._onDelete(options, userId);
  }

  _baseDeck() {
    return game.packs.get(HEIST.COMPENDIUM_DECK_ID).getDocument(this._baseDeckId());
  }

  async _createDeck() {
    const baseDeck = await this._baseDeck();

    return await Cards.create(foundry.utils.mergeObject(baseDeck.toObject(false), {
      name: game.i18n.format('HEIST.Cards.DeckName', { name: this.name }),
      flags: {
        [HEIST.SYSTEM_ID]: {
          generated: true,
        },
      },
    }));
  }

  async _createPile() {
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

  async _deleteDecks() {
    await this.deck?.delete();
    await this.pile?.delete();
  }

  async _shuffleDeck(deck) {
    await deck.shuffle({ chatNotification: false });
  }
}

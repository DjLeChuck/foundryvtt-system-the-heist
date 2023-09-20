import { BaseActor } from './base-actor.mjs';
import * as HEIST from '../../const.mjs';

export class BasePlayerActor extends BaseActor {
  /**
   * @returns {Cards|null}
   */
  get deck() {
    return game.cards.get(this.system.deck);
  }

  /**
   * @returns {Cards|null}
   */
  get hand() {
    return game.cards.get(this.system.hand);
  }

  /**
   * @returns {Cards|null}
   */
  get pile() {
    return game.cards.get(this.system.pile);
  }

  async drawCards(number) {
    await this.hand.draw(this.deck, number, { chatNotification: false });
  }

  async throwHand() {
    await this.hand.pass(this.pile, this.hand.cards.map((c) => c.id), { chatNotification: false });
  }

  /**
   * @return string
   *
   * @abstract
   */
  _baseDeckId() {
    throw new Error('You have to implement the method _baseDeckId!');
  }

  /** @override */
  async _preCreate(data, options, userId) {
    await super._preCreate(data, options, userId);

    const baseDeck = await this.#baseDeck();
    const deck = await Cards.create(foundry.utils.mergeObject(baseDeck.toObject(false), {
      name: game.i18n.format('HEIST.Cards.DeckName', { name: data.name }),
    }));
    const hand = await Cards.create({
      name: game.i18n.format('HEIST.Cards.HandName', { name: data.name }),
      type: 'hand',
    });
    const pile = await Cards.create({
      name: game.i18n.format('HEIST.Cards.PileName', { name: data.name }),
      type: 'pile',
    });

    // Shuffle the cloned deck
    await deck.shuffle({ chatNotification: false });

    this.updateSource({
      system: {
        deck: deck.id,
        hand: hand.id,
        pile: pile.id,
      },
    });
  }

  async _onDelete(options, userId) {
    await this.deck?.delete({});
    await this.hand?.delete({});
    await this.pile?.delete({});

    super._onDelete(options, userId);
  }

  #baseDeck() {
    return game.packs.get(HEIST.COMPENDIUM_DECK_ID).getDocument(this._baseDeckId());
  }
}

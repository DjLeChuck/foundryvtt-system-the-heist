import { BaseActor } from './base-actor.mjs';

export class CharacterActor extends BaseActor {
  /**
   * Get the actor character class item.
   *
   * @returns {CharacterClassItem|null}
   */
  get characterClass() {
    return this.items.find((item) => 'characterClass' === item.type) ?? null;
  }

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
    console.warn(await this.hand.draw(this.deck, number, { chatNotification: false }));
  }

  /** @override */
  async _preCreate(data, options, userId) {
    await super._preCreate(data, options, userId);

    const deck = await Cards.create({
      name: game.i18n.format('HEIST.Cards.AgentDeckName', { name: data.name }),
      type: 'deck',
    });
    const hand = await Cards.create({
      name: game.i18n.format('HEIST.Cards.AgentHandName', { name: data.name }),
      type: 'hand',
    });
    const pile = await Cards.create({
      name: game.i18n.format('HEIST.Cards.AgentPileName', { name: data.name }),
      type: 'pile',
    });

    this.updateSource({
      system: {
        deck: deck.id,
        hand: hand.id,
        pile: pile.id,
      },
    });
  }

  _onDelete(options, userId) {
    this.deck?.delete({});
    this.hand?.delete({});
    this.pile?.delete({});

    super._onDelete(options, userId);
  }
}

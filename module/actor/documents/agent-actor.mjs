import { BasePlayerActor } from './base-player-actor.mjs';
import * as HEIST from '../../const.mjs';

export class AgentActor extends BasePlayerActor {
  /**
   * Get the actor agent type item.
   *
   * @returns {AgentTypeItem|null}
   */
  get agentType() {
    return this.items.find((item) => 'agentType' === item.type) ?? null;
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

    await this.deck.shuffle({ chatNotification: false });

    return ids.length;
  }

  async recallFromPile(number) {
    const recalled = [];

    for (let i = 0; i < number; i++) {
      const id = this.pile.cards.contents[i]?.id;

      if (id) {
        recalled.push(id);
      }
    }

    if (!recalled.length) {
      return 0;
    }

    await this.pile.pass(this.deck, recalled, { chatNotification: false });

    await this.deck.shuffle({ chatNotification: false });

    return recalled.length;
  }

  _baseDeckId() {
    if (null === this.agentType || !this.agentType.getFlag(HEIST.SYSTEM_ID, 'deckId')) {
      ui.notifications.error(game.i18n.format('HEIST.Errors.DeckIdNotSet'));

      return null;
    }

    return this.agentType.getFlag(HEIST.SYSTEM_ID, 'deckId');
  }
}

import { BasePlayerActor } from './base-player-actor.mjs';
import * as HEIST from '../../const.mjs';

export class AgentActor extends BasePlayerActor {
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
    if (!this.fetish || this.fetish.isUsed) {
      return false;
    }

    return 0 < (this.hand?.availableCards.length || 0);
  }

  async useFetish() {
    if (!this.fetish) {
      ui.notifications.error(game.i18n.localize('HEIST.Errors.NoFetishObject'));

      return;
    }

    await this.fetish.update({ 'system.used': true });
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
    const toRecall = Math.min(2, this.pile.availableCards.length);

    if (0 === toRecall) {
      return 0;
    }

    // Draw 2 (or 1) random cards from the pile to the deck
    await this.deck.draw(this.pile, toRecall, {
      how: CONST.CARD_DRAW_MODES.RANDOM,
      chatNotification: false,
    });

    // Shuffle the deck
    await this.deck.shuffle({ chatNotification: false });

    return toRecall;
  }

  _baseDeckId() {
    if (null === this.agentType || !this.agentType.getFlag(HEIST.SYSTEM_ID, 'deckId')) {
      ui.notifications.error(game.i18n.format('HEIST.Errors.DeckIdNotSet'));

      return null;
    }

    return this.agentType.getFlag(HEIST.SYSTEM_ID, 'deckId');
  }

  async _saveCreatedDecks(deck, hand, pile) {
    await this.update({
      system: {
        deck,
        hand,
        pile,
      },
    });
  }
}

import { BaseActorSheet } from './base-actor-sheet.mjs';
import * as HEIST from '../../const.mjs';

export class JackActorSheet extends BaseActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [HEIST.SYSTEM_ID, 'sheet', 'actor', 'jack-sheet'],
      width: 910,
      height: 800,
    });
  }

  /**
   * A convenience reference to the Actor document
   * @type {JackActor}
   */
  get actor() {
    return this.object;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    if (!game.user.isGM) {
      return;
    }

    html.find('[data-draw]').click(this.#onDrawCards.bind(this));
  }

  /** @override */
  async getData() {
    const context = super.getData();

    context.deck = this.actor?.deck;

    await this.#prepareReconnaissanceContext(context);

    return context;
  }

  async #onDrawCards(e) {
    e.preventDefault();

    let numberCardsOptions = '';

    for (let i = 0; i <= Math.min(5, this.actor.deck.availableCards.length); i++) {
      numberCardsOptions += `<option value="${i}">${i}</option>`;
    }

    await Dialog.prompt({
      title: game.i18n.localize('HEIST.Global.DrawCards'),
      content: `<p>
  <label for="number-cards">${game.i18n.localize('HEIST.Cards.HowManyToDraw')}</label>
  <select id="number-cards">${numberCardsOptions}</select>
</p>`,
      callback: async (html) => {
        const nbCards = parseInt(html.find('#number-cards')[0]?.value || '0', 10);
        if (0 === nbCards) {
          return;
        }

        await this.actor.drawCards(this.actor.reconnaissanceHand, nbCards);

        await ChatMessage.create({
          content: await renderTemplate(`systems/${HEIST.SYSTEM_ID}/templates/chat/cards/few-cards-drawn.html.hbs`, {}),
        });
      },
      rejectClose: false,
    });
  }

  async #prepareReconnaissanceContext(context) {
    context.canDrawReconnaissance = HEIST.GAME_PHASE_RECONNAISSANCE === game[HEIST.SYSTEM_ID].gamePhaseWindow.currentPhase?.id
      && this.actor.deck?.availableCards.length;
    context.reconnaissanceHand = this.actor?.reconnaissanceHand;
    context.agentsCompromised = false;

    context.colors = {
      hearts: {
        icon: '♥️',
        label: game.i18n.localize('HEIST.Global.Suit.Hearts'),
        value: 0,
        isOverflowed: false,
      },
      spades: {
        icon: '♠️',
        label: game.i18n.localize('HEIST.Global.Suit.Spades'),
        value: 0,
        isOverflowed: false,
      },
      diamonds: {
        icon: '♦️',
        label: game.i18n.localize('HEIST.Global.Suit.Diamonds'),
        value: 0,
        isOverflowed: false,
      },
      clubs: {
        icon: '♣️',
        label: game.i18n.localize('HEIST.Global.Suit.Clubs'),
        value: 0,
        isOverflowed: false,
      },
    };

    if (!context.reconnaissanceHand) {
      return;
    }

    const handSize = context.reconnaissanceHand.availableCards.length;

    for (const card of context.reconnaissanceHand.cards) {
      ++context.colors[card.suit].value;

      if (HEIST.RECONNAISSANCE_SUIT_OVERFLOW_LIMIT <= context.colors[card.suit].value) {
        context.colors[card.suit].isOverflowed = true;

        if (handSize >= HEIST.RECONNAISSANCE_HAND_TRIGGER_LIMIT) {
          context.agentsCompromised = true;
        }
      }
    }
  }
}

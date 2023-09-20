import { BasePlayerActor } from './base-player-actor.mjs';
import * as HEIST from '../../const.mjs';
import * as CARDS from '../../helpers/cards.mjs';

export class GamemasterActor extends BasePlayerActor {
  /**
   * @returns {AgentActor[]}
   */
  get agents() {
    const agents = [];

    for (const agentId of this.system.agents) {
      agents.push(game.actors.get(agentId));
    }

    return agents;
  }

  _baseDeckId() {
    return HEIST.GM_DECK_ID;
  }

  /**
   * @param {String|undefined} difficulty
   * @param {String|undefined} agentId
   */
  async doAgentTest(difficulty, agentId) {
    if (!difficulty) {
      throw new Error('Missing difficulty for agent test.');
    }

    if (!agentId) {
      throw new Error('Missing agent ID for agent test.');
    }

    await game[HEIST.SYSTEM_ID].cardWindow.prepareTest(this.id, agentId);

    // Draw 3 cards
    await this.drawCards(3);

    // Sort them by value
    const sortedCards = CARDS.sortByValue(this.hand.cards);

    let removedCard;

    switch (difficulty) {
      case 'easy':
        // Hide "easy" card
        await sortedCards[0].flip(null);

        // Remove the last card
        removedCard = sortedCards[2].id;

        break;
      case 'difficult':
        // Hide "difficult" card
        await sortedCards[2].flip(null);

        // Remove the first card
        removedCard = sortedCards[0].id;

        break;
      default:
        throw new Error(`Unknown difficulty "${difficulty}"`);
    }

    // Remove the unwanted card
    await this.hand.pass(this.pile, [removedCard], { chatNotification: false });

    game[HEIST.SYSTEM_ID].cardWindow.render(true);
  }

  async revealTest() {
    for (const card of this.hand.cards.contents) {
      await card.flip(0);
    }
  }
}

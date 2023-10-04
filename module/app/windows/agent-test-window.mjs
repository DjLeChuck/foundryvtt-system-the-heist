import * as HEIST from '../../const.mjs';
import * as CARDS from '../../helpers/cards.mjs';
import { WithSettingsWindow } from './with-settings-window.mjs';

export class AgentTestWindow extends WithSettingsWindow {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [HEIST.SYSTEM_ID, 'agent-test-window'],
      title: game.i18n.localize('HEIST.AgentTestWindow.Title'),
      template: `systems/${HEIST.SYSTEM_ID}/templates/app/agent-test-window.html.hbs`,
      width: 750,
      height: 800,
      settingsName: 'currentTest',
    });
  }

  /**
   * @returns {JackActor|null}
   */
  get jack() {
    const jackID = this._getSetting('jack');
    if (!jackID) {
      return null;
    }

    const jack = game.actors.get(jackID);
    if (!jack) {
      return null;
    }

    return jack;
  }

  /**
   * @returns {AgentActor|null}
   */
  get agent() {
    const agentId = this._getSetting('agent');
    if (!agentId) {
      return null;
    }

    const agent = game.actors.get(agentId);
    if (!agent) {
      return null;
    }

    return agent;
  }

  /**
   * @returns {boolean}
   */
  get isRevealed() {
    return this._getSetting('isRevealed', false);
  }

  /**
   * @returns {boolean}
   */
  get isFinished() {
    return this._getSetting('isFinished', false);
  }

  /**
   * @returns {boolean}
   */
  get isSuccessful() {
    return this._getSetting('isSuccessful', false);
  }

  async prepareTest(jack, agent) {
    await this._setSettings({
      jack,
      agent,
      isRevealed: false,
      isFinished: false,
      isSuccessful: false,
    });

    await this.#clearHands();
  }

  getData() {
    const jack = this.jack;
    const agent = this.agent;

    if (null === jack || null === agent) {
      return {
        test: {
          isRunning: false,
        },
      };
    }

    const jackCards = jack.testHand.cards;
    const agentCards = agent.hand.cards;
    const agentScore = CARDS.scoreForAgent(agentCards);
    const jackTotalScore = CARDS.scoreForJack(jackCards);

    return {
      isAdmin: game.user.isGM,
      test: {
        isRunning: true,
        isRevealed: this.isRevealed,
        isFinished: this.isFinished,
        isSuccessful: this.isSuccessful,
        isBlackjack: 21 === agentScore,
      },
      jack: {
        cards: CARDS.sortByValue(jackCards),
        score: CARDS.scoreForAgent(jackCards),
        totalScore: jackTotalScore,
      },
      agent: {
        name: agent.name,
        isOwner: agent.isOwner,
        cards: CARDS.sortByValue(agentCards),
        score: agentScore,
        canDraw: 0 < agent.deck.availableCards.length,
        canUseFetish: agent.canUseFetish,
      },
    };
  }

  activateListeners(html) {
    const agent = this.agent;

    if (agent?.isOwner) {
      html.find('[data-draw]').click(this._onDraw.bind(this));
      html.find('[data-finish]').click(this._onFinishTest.bind(this));
      html.find('[data-fetish]').click(this._onUseFetish.bind(this));
    }

    if (!game.user.isGM) {
      return;
    }

    html.find('[data-reveal]').click(this._onRevealTest.bind(this));
    html.find('[data-blackjack]').click(this._onBlackjack.bind(this));
  }

  async _onDraw(e) {
    e.preventDefault();

    await this.agent.drawCards(1);

    this.#refreshViews();
  }

  async _onFinishTest(e) {
    e.preventDefault();

    await this._setSettings({
      isSuccessful: CARDS.scoreForJack(this.agent.hand.cards) >= CARDS.scoreForJack(this.jack.testHand.cards),
      isFinished: true,
    });

    this.#refreshViews();
  }

  async _onUseFetish(e) {
    e.preventDefault();

    await this.agent.useFetish();

    await this._setSettings({
      isSuccessful: true,
      isFinished: true,
    });

    this.#refreshViews();
  }

  async _onRevealTest(e) {
    e.preventDefault();

    if (!game.user.isGM) {
      return;
    }

    await this.jack.revealTest();

    await this._setSettings({ isRevealed: true });

    this.#refreshViews();
  }

  async _onBlackjack(e) {
    e.preventDefault();

    if (!game.user.isGM) {
      return;
    }

    const testedAgent = this.agent;
    const recalls = [];

    for (const agent of this.jack.agents) {
      if (agent === testedAgent) {
        const number = await agent.recallHand();

        recalls.push({
          number,
          agent: agent.name,
          tested: true,
          show: 0 < number,
        });
      } else {
        const number = await agent.recallFromPile(2);

        recalls.push({
          number,
          agent: agent.name,
          tested: false,
          show: 0 < number,
        });
      }
    }

    await ChatMessage.create({
      content: await renderTemplate(`systems/${HEIST.SYSTEM_ID}/templates/chat/cards/blackjack.html.hbs`, {
        recalls,
      }),
    });

    this.#refreshViews();
  }

  async #clearHands() {
    if (!this.jack) {
      return;
    }

    await this.jack.throwTestHand();

    for (const agent of this.jack.agents) {
      await agent.throwHand();
    }
  }

  #refreshViews() {
    this.render(true);

    if (this.jack?.sheet.rendered) {
      this.jack?.sheet?.render(false, { focus: false });
    }

    if (this.agent?.sheet.rendered) {
      this.agent?.sheet?.render(false, { focus: false });
    }
  }
}

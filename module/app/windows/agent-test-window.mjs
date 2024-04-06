import * as HEIST from '../../const.mjs';
import * as CARDS from '../../helpers/cards.mjs';
import { WithSettingsWindow } from './with-settings-window.mjs';

export class AgentTestWindow extends WithSettingsWindow {
  #testSuccessBlackjack = 0;
  #testSuccessFetish = 1;
  #testSuccessCards = 2;
  #testFailure = 99;

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
  get #isFinished() {
    return this._getSetting('isFinished', false);
  }

  /**
   * @returns {boolean}
   */
  get #isSuccessful() {
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
    if (this.#isFinished) {
      return {
        test: {
          isRunning: false,
        },
      };
    }

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

    return {
      isAdmin: game.user.isGM,
      test: {
        isRunning: true,
        isRevealed: this.isRevealed,
      },
      jack: {
        cards: CARDS.sortByValue(jackCards),
        score: CARDS.scoreForAgent(jackCards),
        totalScore: CARDS.scoreForJack(jackCards),
      },
      agent: {
        name: agent.name,
        isOwner: agent.isOwner,
        cards: CARDS.sortByValue(agentCards),
        score: CARDS.scoreForAgent(agentCards),
        canDraw: agent.canDraw,
        canUseFetish: agent.canUseFetish,
      },
    };
  }

  activateListeners(html) {
    const agent = this.agent;

    if (agent?.isOwner) {
      html.on('click', '[data-draw]', this.#onDraw.bind(this));
      html.on('click', '[data-finish]', this.#onFinishTest.bind(this));
      html.on('click', '[data-fetish]', this.#onUseFetish.bind(this));
    }

    if (!game.user.isGM) {
      return;
    }

    html.on('click', '[data-reveal]', this.#onRevealTest.bind(this));
  }

  async handleAgentBlackjack() {
    if (game.user !== game.users.activeGM) {
      return;
    }

    await this._setSettings({ isSuccessful: true });

    await this.#revealTest();
    await this.#finishTest(this.#testSuccessBlackjack);
    await this.#processBlackjack();
  }

  async handleAgentFetish() {
    if (game.user !== game.users.activeGM) {
      return;
    }

    await this._setSettings({ isSuccessful: true });

    await this.#revealTest();
    await this.#finishTest(this.#testSuccessFetish);
  }

  async #onDraw(e) {
    e.preventDefault();

    await this.agent.drawCards(1);

    if (this.#isBlackjack()) {
      if (game.user.isGM) {
        await this.handleAgentBlackjack();
      } else {
        game.socket.emit(`system.${HEIST.SYSTEM_ID}`, { request: HEIST.SOCKET_REQUESTS.GM_HANDLE_AGENT_TEST_BLACKJACK });
      }
    }

    this.#refreshViews();
  }

  async #onFinishTest(e) {
    e.preventDefault();

    const jackScore = CARDS.scoreForJack(this.jack.testHand.cards);
    const agentScore = CARDS.scoreForJack(this.agent.hand.cards);
    const isSuccessful = agentScore >= jackScore;

    await this._setSettings({
      isSuccessful,
    });

    await this.#finishTest(isSuccessful ? this.#testSuccessCards : this.#testFailure, {
      agentScore,
      scoreToBeat: jackScore,
    });
  }

  async #onUseFetish(e) {
    e.preventDefault();

    await this.agent.useFetish();

    if (game.user.isGM) {
      await this.handleAgentFetish();
    } else {
      game.socket.emit(`system.${HEIST.SYSTEM_ID}`, { request: HEIST.SOCKET_REQUESTS.GM_HANDLE_AGENT_TEST_FETISH });
    }

    this.#refreshViews();
  }

  async #onRevealTest(e) {
    e.preventDefault();

    if (!game.user.isGM) {
      return;
    }

    await this.#revealTest();

    this.#refreshViews();
  }

  async #clearHands() {
    await this.jack?.throwTestHand();
    await this.agent?.throwHand();
  }

  async #revealTest() {
    await this.jack.revealTest();

    await this._setSettings({ isRevealed: true });
  }

  async #finishTest(resultType, payload = {}) {
    await this._setSettings({ isFinished: true });

    const messagePayload = Object.assign({}, payload, {
      agent: this.agent,
    });

    if (this.#isSuccessful) {
      let messageTemplate = `systems/${HEIST.SYSTEM_ID}/templates/chat/agent-test/success.html.hbs`;

      switch (resultType) {
        case this.#testSuccessBlackjack:
          messageTemplate = `systems/${HEIST.SYSTEM_ID}/templates/chat/agent-test/success-blackjack.html.hbs`;
          break;
        case this.#testSuccessFetish:
          messageTemplate = `systems/${HEIST.SYSTEM_ID}/templates/chat/agent-test/success-fetish.html.hbs`;
          break;
        case this.#testSuccessCards:
          messageTemplate = `systems/${HEIST.SYSTEM_ID}/templates/chat/agent-test/success-cards.html.hbs`;
          break;
      }

      await ChatMessage.create({
        content: await renderTemplate(messageTemplate, messagePayload),
      });
    } else {
      await ChatMessage.create({
        content: await renderTemplate(
          `systems/${HEIST.SYSTEM_ID}/templates/chat/agent-test/failure.html.hbs`,
          messagePayload,
        ),
      });
    }

    await this.close();

    game.socket.emit(`system.${HEIST.SYSTEM_ID}`, { request: HEIST.SOCKET_REQUESTS.CLOSE_AGENT_TEST_WINDOW });
  }

  async #processBlackjack() {
    if (!game.user.isGM) {
      return;
    }

    const testedAgent = this.agent;
    const recalls = [];

    for (const agent of this.jack.agency?.agents) {
      if (agent === testedAgent) {
        const number = await agent.recallHand();

        recalls.push({
          number,
          agent: agent.name,
          tested: true,
          show: 0 < number,
        });
      }

      const number = await agent.recallFromPile(2);

      recalls.push({
        number,
        agent: agent.name,
        tested: false,
        show: 0 < number,
      });
    }

    await ChatMessage.create({
      content: await renderTemplate(`systems/${HEIST.SYSTEM_ID}/templates/chat/cards/blackjack.html.hbs`, {
        recalls,
      }),
    });
  }

  #isBlackjack() {
    return CARDS.BLACKJACK_SCORE === CARDS.scoreForAgent(this.agent.hand.cards);
  }

  #refreshViews() {
    this.render(true);

    if (this.jack?.sheet.rendered) {
      this.jack?.sheet?.render(false, { focus: false });
    }

    if (this.agent?.sheet.rendered) {
      this.agent?.sheet?.render(false, { focus: false });
    }

    game.socket.emit(`system.${HEIST.SYSTEM_ID}`, { request: HEIST.SOCKET_REQUESTS.REFRESH_AGENT_TEST_WINDOW });
  }
}

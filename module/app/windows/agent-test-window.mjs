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
      height: 850,
      settingsName: 'currentTest',
      resizable: true,
    });
  }

  /**
   * @returns {JackActor|null}
   */
  get jack() {
    const jackId = this._getSetting('jack');
    if (!jackId) {
      return null;
    }

    const jack = game.actors.get(jackId);
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
  get canAskTest() {
    return game.user.isGM && !this.isRunning && (!this.jack || this.jack.canAskTest);
  }

  /**
   * @returns {boolean}
   */
  get isRunning() {
    return this._getSetting('isRunning', false);
  }

  /**
   * @returns {boolean}
   */
  get #isRevealed() {
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

  /**
   * @return {SimpleCard[]}
   */
  get #agentCards() {
    return this._getSetting('agentCards', []);
  }

  /**
   * @return {SimpleCard[]}
   */
  get #jackCards() {
    return this._getSetting('jackCards', []);
  }

  get #isBlackjack() {
    return CARDS.BLACKJACK_SCORE === CARDS.scoreForAgent(this.#agentCards);
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

    const jackCards = this.#jackCards;
    const agentCards = this.#agentCards;

    return {
      isAdmin: game.user.isGM,
      test: {
        isRunning: true,
        isRevealed: this.#isRevealed,
        isFinished: this.#isFinished,
        isSuccessful: this.#isSuccessful,
        isBlackjack: this.#isBlackjack,
      },
      jack: {
        name: jack.name,
        cards: jackCards,
        score: CARDS.scoreForAgent(jackCards),
        totalScore: CARDS.scoreForJack(jackCards),
      },
      agent: {
        name: agent.name,
        isOwner: agent.isOwner,
        cards: agentCards,
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

  /**
   * @param {String} difficulty
   * @param {String} jackId
   * @param {String} agentId
   */
  async doAgentTest(difficulty, jackId, agentId) {
    await this.#prepareTest(jackId, agentId);

    const cards = await this.jack.drawCards(this.jack.testHand, 3);

    // Sort them by value and clone them
    const jackCards = CARDS.simpleClone(CARDS.sortByValue(cards));

    switch (difficulty) {
      case 'easy':
        // Hide "easy" card
        jackCards[0].visible = false;

        // Exclude the last card
        jackCards[2].excluded = true;

        break;
      case 'difficult':
        // Hide "difficult" card
        jackCards[0].excluded = true;

        // Exclude the first card
        jackCards[2].visible = false;

        break;
      default:
        throw new Error(`Unknown difficulty "${difficulty}"`);
    }

    await this._setSettings({ jackCards });

    this.render(true);
    game.socket.emit(`system.${HEIST.SYSTEM_ID}`, { request: HEIST.SOCKET_REQUESTS.SHOW_AGENT_TEST_WINDOW });
  }

  async handleAgentBlackjack() {
    if (game.user !== game.users.activeGM) {
      return;
    }

    await this._setSettings({ isSuccessful: true });

    await this.#revealTest();
    await this.#finishTest(true, this.#testSuccessBlackjack);
    await this.#processBlackjack();
  }

  async handleAgentFetish() {
    if (game.user !== game.users.activeGM) {
      return;
    }

    await this._setSettings({ isSuccessful: true });

    await this.#revealTest();
    await this.#finishTest(true, this.#testSuccessFetish);
  }

  async #prepareTest(jack, agent) {
    await this._setSettings({
      jack,
      agent,
      isRunning: true,
      isRevealed: false,
      isFinished: false,
      isSuccessful: false,
      jackCards: [],
      agentCards: [],
    });

    await this.#clearHands();
  }

  async #onDraw(e) {
    e.preventDefault();

    const cards = await this.agent.drawCards(1);

    await this._setSettings({ agentCards: [...this.#agentCards, ...CARDS.simpleClone(cards)] });

    this.#refreshViews();

    if (this.#isBlackjack) {
      if (game.user.isGM) {
        await this.handleAgentBlackjack();
      } else {
        game.socket.emit(`system.${HEIST.SYSTEM_ID}`, {
          request: HEIST.SOCKET_REQUESTS.GM_HANDLE_AGENT_TEST_BLACKJACK,
        });
      }
    }
  }

  async #onFinishTest(e) {
    e.preventDefault();

    await this.#revealTest();

    const jackScore = CARDS.scoreForJack(this.#jackCards);
    const agentScore = CARDS.scoreForJack(this.#agentCards);
    const isSuccessful = agentScore >= jackScore;

    await this.#finishTest(isSuccessful, isSuccessful ? this.#testSuccessCards : this.#testFailure, {
      agentScore,
      scoreToBeat: jackScore,
    });
  }

  async #onUseFetish(e) {
    e.preventDefault();

    await this.agent.useFetish();

    this.#refreshViews();

    if (game.user.isGM) {
      await this.handleAgentFetish();
    } else {
      game.socket.emit(`system.${HEIST.SYSTEM_ID}`, { request: HEIST.SOCKET_REQUESTS.GM_HANDLE_AGENT_TEST_FETISH });
    }
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

    for (const agent of this.jack.agency?.agents) {
      await agent.throwHand();
    }
  }

  async #revealTest() {
    const jackCards = this.#jackCards;

    jackCards.map((card) => {
      if (!card.excluded) {
        card.visible = true;
      }
    });

    await this._setSettings({ jackCards, isRevealed: true });
  }

  async #finishTest(isSuccessful, resultType, payload = {}) {
    await this._setSettings({
      isSuccessful,
      isFinished: true,
      isRevealed: true,
      isRunning: false,
    });

    await this.#clearHands();

    const messagePayload = Object.assign({}, payload, {
      agent: this.agent,
    });

    if (isSuccessful) {
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

    game.socket.emit(`system.${HEIST.SYSTEM_ID}`, {
      request: HEIST.SOCKET_REQUESTS.REFRESH_AGENCY_SHEET,
      agencyId: this.jack.agency.id,
    });

    this.jack.agency.render();
    this.render();
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

    this.#refreshJackAndAgentsSheet();
  }

  #refreshViews() {
    this.render(true);

    this.#refreshJackAndAgentsSheet();

    game.socket.emit(`system.${HEIST.SYSTEM_ID}`, { request: HEIST.SOCKET_REQUESTS.REFRESH_AGENT_TEST_WINDOW });
  }

  #refreshJackAndAgentsSheet() {
    if (this.jack?.sheet.rendered) {
      this.jack?.sheet?.render(false, { focus: false });
    }

    for (const agent of this.jack.agency?.agents) {
      agent?.sheet?.render(false, { focus: false });
    }

    this.jack.agency?.sheet?.render(false, { focus: false });
  }
}

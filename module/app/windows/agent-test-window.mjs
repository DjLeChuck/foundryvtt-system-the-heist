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
   * @returns {HeistActor|null}
   */
  get agency() {
    const agencyId = this._getSetting('agency');
    if (!agencyId) {
      return null;
    }

    const agency = game.actors.get(agencyId);
    if (!agency) {
      return null;
    }

    return agency;
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
   * @returns {Boolean}
   */
  get canAskTest() {
    return game.user.isGM && !this.isRunning && (!this.agency || this.agency.jackCanAskTest);
  }

  /**
   * @returns {Boolean}
   */
  get isRunning() {
    return this._getSetting('isRunning', false);
  }

  /**
   * @returns {Boolean}
   */
  get #isRevealed() {
    return this._getSetting('isRevealed', false);
  }

  /**
   * @returns {Boolean}
   */
  get #isFinished() {
    return this._getSetting('isFinished', false);
  }

  /**
   * @returns {Boolean}
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
    return CARDS.BLACKJACK_SCORE === CARDS.scoreForAgent(this.#agentCards, true);
  }

  getData() {
    const agency = this.agency;
    const agent = this.agent;

    if (null === agency || null === agent) {
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
        name: 'Jack',
        cards: jackCards,
        score: !this.#isRevealed && CARDS.includesJoker(jackCards) ? '?' : CARDS.scoreForAgent(jackCards, false),
        totalScore: CARDS.scoreForJack(jackCards),
      },
      agent: {
        name: agent.name,
        isOwner: agent.isOwner,
        cards: agentCards,
        score: CARDS.scoreForAgent(agentCards, true),
        canDraw: agent.canDraw,
        canUseFetish: agent.canUseFetish,
      },
    };
  }

  activateListeners(html) {
    const agent = this.agent;

    if (agent?.isOwner) {
      html.on('click', '[data-draw]', this.#onDraw.bind(this));
      html.on('click', '[data-fetish]', this.#onUseFetish.bind(this));
    }

    if (!game.user.isGM) {
      return;
    }

    html.on('click', '[data-finish]', this.#onFinishTest.bind(this));
    html.on('click', '[data-reveal]', this.#onRevealTest.bind(this));
  }

  /**
   * @param {String} difficulty
   * @param {String} agencyId
   * @param {String} agentId
   * @param {Number} jokerToUse
   */
  async doAgentTest(difficulty, agencyId, agentId, jokerToUse) {
    await this.#prepareTest(agencyId, agentId);

    let cards;

    if (0 !== jokerToUse) {
      cards = await this.agency.jackDrawCards(this.agency.jackTestHand, 2);

      // The drawn cards already contains a Joker
      if (CARDS.includesJoker(cards)) {
        cards.push(...await this.agency.jackDrawCards(this.agency.jackTestHand, 1));
      } else {
        // -1 -> index 0
        const joker = await this.agency.jackDrawJoker(this.agency.jackTestHand, jokerToUse - 1);

        if (null === joker) {
          // Error, no joker, add a new card
          ui.notifications.error('No joker available!');

          cards.push(...await this.agency.jackDrawCards(this.agency.jackTestHand, 1));
        } else {
          cards.push(joker);
        }
      }
    } else {
      cards = await this.agency.jackDrawCards(this.agency.jackTestHand, 3);
    }

    // Clone cards
    const copyCards = CARDS.simpleClone(CARDS.sortByValue(cards));
    const hasJoker = CARDS.includesJoker(copyCards);
    const jackCards = [];

    switch (difficulty) {
      case 'easy':
        if (hasJoker) {
          copyCards[1].visible = false;

          jackCards.push(copyCards[1]);
          jackCards.push(copyCards[0]);
        } else {
          copyCards[0].visible = false;

          jackCards.push(copyCards[0]);
          jackCards.push(copyCards[1]);
        }

        copyCards[2].excluded = true;

        jackCards.push(copyCards[2]);

        break;
      case 'difficult':
        copyCards[2].visible = false;

        if (hasJoker) {
          copyCards[1].excluded = true;

          jackCards.push(copyCards[0]);
          jackCards.push(copyCards[2]);
          jackCards.push(copyCards[1]);
        } else {
          copyCards[0].excluded = true;

          jackCards.push(copyCards[1]);
          jackCards.push(copyCards[2]);
          jackCards.push(copyCards[0]);
        }

        break;
      default:
        throw new Error(`Unknown difficulty "${difficulty}"`);
    }

    await this._setSettings({ jackCards });

    this.render(true);
    game.socket.emit(`system.${HEIST.SYSTEM_ID}`, { request: HEIST.SOCKET_REQUESTS.SHOW_AGENT_TEST_WINDOW });
  }

  async handleAgentDraw(cards) {
    if (game.user !== game.users.activeGM) {
      return;
    }

    await this._setSettings({ agentCards: [...this.#agentCards, ...CARDS.simpleClone(cards)] });

    this.#refreshViews();

    if (this.#isBlackjack) {
      await this.#handleAgentBlackjack();
    }
  }

  async #handleAgentBlackjack() {
    await this._setSettings({ isSuccessful: true });

    await this.#revealTest();
    await this.#finishTest(true, this.#testSuccessBlackjack);
    await this.#processBlackjack();

    this.#refreshViews();
  }

  async handleAgentFetish() {
    if (game.user !== game.users.activeGM) {
      return;
    }

    await this._setSettings({ isSuccessful: true });

    await this.#revealTest();
    await this.#finishTest(true, this.#testSuccessFetish);

    await this.#refreshViews();
  }

  async #prepareTest(agency, agent) {
    await this._setSettings({
      agency,
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

    if (game.user.isGM) {
      await this.handleAgentDraw(cards);
    } else {
      game.socket.emit(`system.${HEIST.SYSTEM_ID}`, {
        cards,
        request: HEIST.SOCKET_REQUESTS.GM_HANDLE_AGENT_DRAW,
      });
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

    this.#refreshViews();
  }

  async #onUseFetish(e) {
    e.preventDefault();

    await this.agent.useFetish();

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
    await this.agency?.jackThrowTestHand();

    for (const agent of this.agency?.agents) {
      await agent?.throwHand();
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

      await ChatMessage.implementation.create({
        content: await renderTemplate(messageTemplate, messagePayload),
      });
    } else {
      await ChatMessage.implementation.create({
        content: await renderTemplate(
          `systems/${HEIST.SYSTEM_ID}/templates/chat/agent-test/failure.html.hbs`,
          messagePayload,
        ),
      });
    }

    game.socket.emit(`system.${HEIST.SYSTEM_ID}`, {
      request: HEIST.SOCKET_REQUESTS.REFRESH_AGENCY_SHEET,
      agencyId: this.agency.id,
    });

    await this.#clearHands();

    this.agency.render();
    this.render();
  }

  async #processBlackjack() {
    if (!game.user.isGM) {
      return;
    }

    const testedAgent = this.agent;
    const recalls = [];

    for (const agent of this.agency?.agents) {
      if (!agent) {
        continue;
      }

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

    await ChatMessage.implementation.create({
      content: await renderTemplate(`systems/${HEIST.SYSTEM_ID}/templates/chat/cards/blackjack.html.hbs`, {
        recalls,
      }),
    });

    this.#refreshLinkedSheets();
  }

  #refreshViews() {
    this.render(true);

    this.#refreshLinkedSheets();

    game.socket.emit(`system.${HEIST.SYSTEM_ID}`, { request: HEIST.SOCKET_REQUESTS.REFRESH_AGENT_TEST_WINDOW });
  }

  #refreshLinkedSheets() {
    for (const agent of this.agency?.agents) {
      agent?.sheet?.render(false, { focus: false });
    }

    this.agency?.sheet?.render(false, { focus: false });
  }
}

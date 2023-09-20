import * as HEIST from '../../const.mjs';
import * as CARDS from '../../helpers/cards.mjs';

export class CardWindow extends Application {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: [HEIST.SYSTEM_ID, 'card-window'],
      template: `systems/${HEIST.SYSTEM_ID}/templates/app/card-window.html.hbs`,
      width: 750,
      height: 800,
    });
  }

  /**
   * @returns {GamemasterActor|null}
   */
  get gm() {
    const gmID = game.settings.get(HEIST.SYSTEM_ID, 'currentTest')?.gm;
    if (!gmID) {
      return null;
    }

    const gm = game.actors.get(gmID);
    if (!gm) {
      return null;
    }

    return gm;
  }

  /**
   * @returns {AgentActor|null}
   */
  get agent() {
    const agentId = game.settings.get(HEIST.SYSTEM_ID, 'currentTest')?.agent;
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
    return game.settings.get(HEIST.SYSTEM_ID, 'currentTest')?.isRevealed ?? false;
  }

  /**
   * @returns {boolean}
   */
  get isFinished() {
    return game.settings.get(HEIST.SYSTEM_ID, 'currentTest')?.isFinished ?? false;
  }

  async prepareTest(gm, agent) {
    await this.#setTestSettings({
      gm,
      agent,
      isRevealed: false,
      isFinished: false,
    });

    await this.#clearHands();
  }

  getData() {
    const gm = this.gm;
    const agent = this.agent;

    if (null === gm || null === agent) {
      return {
        test: {
          isRunning: false,
        },
      };
    }

    const gmCards = gm.hand.cards;
    const agentCards = agent.hand.cards;
    const agentScore = CARDS.scoreForAgent(agentCards);
    const gmTotalScore = CARDS.scoreForGM(gmCards);

    return {
      isAdmin: game.user.isGM,
      test: {
        isRunning: true,
        isRevealed: this.isRevealed,
        isFinished: this.isFinished,
        isSuccessful: agentScore >= gmTotalScore,
        isBlackjack: 21 === agentScore,
      },
      gm: {
        cards: CARDS.sortByValue(gmCards),
        score: CARDS.scoreForAgent(gmCards),
        totalScore: gmTotalScore,
      },
      agent: {
        name: agent.name,
        isOwner: agent.isOwner,
        cards: CARDS.sortByValue(agentCards),
        score: agentScore,
        canDraw: 0 < agent.deck.availableCards.length,
      },
    };
  }

  activateListeners(html) {
    const agent = this.agent;

    if (agent?.isOwner) {
      html.find('[data-draw]').click(this._onDraw.bind(this));
      html.find('[data-finish]').click(this._onFinishTest.bind(this));
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

    await this.#setTestSettings({ isFinished: true });

    this.#refreshViews();
  }

  async _onRevealTest(e) {
    e.preventDefault();

    if (!game.user.isGM) {
      return;
    }

    await this.gm.revealTest();

    await this.#setTestSettings({ isRevealed: true });

    this.#refreshViews();
  }

  async _onBlackjack(e) {
    e.preventDefault();

    if (!game.user.isGM) {
      return;
    }

    const testedAgent = this.agent;
    const recalls = [];

    for (const agent of this.gm.agents) {
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

    ChatMessage.create({
      content: await renderTemplate(`systems/${HEIST.SYSTEM_ID}/templates/chat/cards/blackjack.html.hbs`, {
        recalls,
      }),
    });
  }

  #currentTestSettings() {
    return game.settings.get(HEIST.SYSTEM_ID, 'currentTest').toJSON();
  }

  async #setTestSettings(settings) {
    await game.settings.set(HEIST.SYSTEM_ID, 'currentTest', mergeObject(
      this.#currentTestSettings(),
      settings,
    ));
  }

  async #clearHands() {
    if (!this.gm) {
      return;
    }

    await this.gm?.throwHand();

    for (const agent of this.gm.agents) {
      await agent.throwHand();
    }
  }

  #refreshViews() {
    this.render(true);

    if (this.gm?.sheet.rendered) {
      this.gm?.sheet?.render(true, { focus: false });
    }

    if (this.agent?.sheet.rendered) {
      this.agent?.sheet?.render(true, { focus: false });
    }
  }
}

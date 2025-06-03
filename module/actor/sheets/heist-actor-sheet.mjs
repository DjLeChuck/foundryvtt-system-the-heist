import * as HEIST from '../../const.mjs';
import { range } from '../../helpers/utils.mjs';

const { api, fields, handlebars, sheets, ux } = foundry.applications;

export default class HeistActorSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
  constructor(options, ...args) {
    super(options, ...args);

    Hooks.on('updateCard', async (card, change) => {
      if (!change?.drawn) {
        return;
      }

      this.render();
    });

    Hooks.on('updateActor', async (actor) => {
      if (actor === this.actor || actor?.agency?._id !== this.actor?._id) {
        return;
      }

      this.render();
    });

    Hooks.on(`${HEIST.SYSTEM_ID}.changeGamePhase`, () => this.render());
  }

  static DEFAULT_OPTIONS = {
    classes: [HEIST.SYSTEM_ID, 'actor', 'heist-sheet'],
    position: {
      width: 830,
      height: 935,
    },
    window: {
      contentClasses: ['flexcol'],
    },
    actions: {
      removeActor: this.#onRemoveActor,
      openSheet: this.#onOpenSheet,
      harmAgent: this.#onHarmAgent,
      rescueAgent: this.#onRescueAgent,
      useRescue: this.#onUseRescue,
      killAgent: this.#onKillAgent,
      addPlanningItem: this.#onAddPlanningItem,
      askAgentTest: this.#onAskAgentTest,
      openAgentTest: this.#onOpenAgentTest,
      editItem: this.#onEditItem,
      removeItem: this.#onRemoveItem,
    },
    form: {
      submitOnChange: true,
    },
  };

  static PARTS = {
    header: {
      template: `systems/${HEIST.SYSTEM_ID}/templates/actor/heist/header.html.hbs`,
    },
    nav: {
      template: `systems/${HEIST.SYSTEM_ID}/templates/actor/heist/nav.html.hbs`,
    },
    body: {
      template: `systems/${HEIST.SYSTEM_ID}/templates/actor/actor-heist-sheet.html.hbs`,
    },
    jokers: {
      template: `systems/${HEIST.SYSTEM_ID}/templates/actor/heist/jokers.html.hbs`,
    },
    agency: {
      template: `systems/${HEIST.SYSTEM_ID}/templates/actor/heist/agency.html.hbs`,
      templates: [
        `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_heist-jack.html.hbs`,
        `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_heist-agent.html.hbs`,
      ],
    },
    reconnaissance: {
      template: `systems/${HEIST.SYSTEM_ID}/templates/actor/heist/reconnaissance.html.hbs`,
    },
    planning: {
      template: `systems/${HEIST.SYSTEM_ID}/templates/actor/heist/planning.html.hbs`,
    },
    progression: {
      template: `systems/${HEIST.SYSTEM_ID}/templates/actor/heist/progression.html.hbs`,
    },
  };

  static TABS = {
    sheet: {
      tabs: [
        { id: 'jokers', group: 'sheet', label: 'HEIST.HeistSheet.Jokers.Title' },
        { id: 'agency', group: 'sheet', label: 'HEIST.HeistSheet.TheAgency' },
        { id: 'reconnaissance', group: 'sheet', label: 'HEIST.GamePhases.Phase2.Title' },
        { id: 'planning', group: 'sheet', label: 'HEIST.GamePhases.Phase3.Title' },
        { id: 'progression', group: 'sheet', label: 'HEIST.GamePhases.Phase5.Title' },
      ],
      initial: 'agency',
    },
  };

  /** @override */
  async _prepareContext(options) {
    return Object.assign({}, await super._prepareContext(options), {
      system: this.document.system,
      systemFields: this.document.system.schema.fields,
      isGM: game.user.isGM,
      canAskTest: game[HEIST.SYSTEM_ID].agentTestWindow.canAskTest,
    });
  }

  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);

    if ('jokers' === partId) {
      await this.#prepareJokersContext(context);
    } else if ('agency' === partId) {
      await this.#prepareAgencyContext(context);
    } else if ('reconnaissance' === partId) {
      await this.#prepareReconnaissanceContext(context);
    } else if ('planning' === partId) {
      await this.#preparePlanningContext(context);
    } else if ('progression' === partId) {
      await this.#prepareProgressionContext(context);
    }

    return context;
  }

  async _onDropActor(event, data) {
    if (!game.user.isGM) {
      return false;
    }

    /** @var Actor actor */
    const actor = await fromUuid(data.uuid);
    if ('agent' !== actor?.type) {
      return false;
    }

    const agentType = actor.system.agentType;
    if (null === agentType || !agentType.system?.type) {
      return false;
    }

    if (null !== actor.system.agencyDocument) {
      ui.notifications.error(game.i18n.localize('HEIST.Errors.AgentAlreadyInAgency'));

      return false;
    }

    const current = await game.actors.get(this.document.system[agentType.system.type]);
    if (current) {
      await current.update({ 'system.agency': null });
    }

    await this.document.update({ [`system.${agentType.system.type}`]: actor.id });

    await actor.update({ 'system.agency': this.actor.id });
  }

  async _onDropItem(event, data) {
    if (!game.user.isGM) {
      return false;
    }

    /** @var Item item */
    const item = await fromUuid(data.uuid);
    if ('planning' !== item?.type) {
      return false;
    }

    return super._onDropItem(event, data);
  }

  /**
   * @returns {Record<string, Record<string, ApplicationTab>>}
   */
  #getTabs() {
    const tabs = {};
    for (const [groupId, config] of Object.entries(this.constructor.TABS)) {
      const group = {};
      for (const t of config) {
        const active = this.tabGroups[t.group] === t.id;
        group[t.id] = Object.assign({ active, cssClass: active ? 'active' : '' }, t);
      }
      tabs[groupId] = group;
    }

    if (!game.user.isGM) {
      delete tabs.sheet.jokers;
      delete tabs.sheet.reconnaissance;
    }

    return tabs;
  }

  async #prepareJokersContext(context) {
    const recoJokersPiles = range(1, this.document.system.jack.jokerPhasesConfigurations.reconnaissance.numberOfPile);
    const actionJokerPiles = range(1, this.document.system.jack.jokerPhasesConfigurations.action.numberOfPile);

    context.jokers = {
      reconnaissance: recoJokersPiles,
      action: actionJokerPiles,
    };
  }

  async #prepareAgencyContext(context) {
    context.jackAvailableCards = this.document.system.jackDeck?.availableCards.length;
    context.diamond = this.document.system.diamondDocument;
    context.heart = this.document.system.heartDocument;
    context.spade = this.document.system.spadeDocument;
    context.club = this.document.system.clubDocument;
  }

  async #prepareReconnaissanceContext(context) {
    context.canDrawReconnaissance = HEIST.GAME_PHASE_RECONNAISSANCE === game[HEIST.SYSTEM_ID].gamePhaseWindow.currentPhase?.id
      && this.document.jackCanDraw;
    context.reconnaissanceHand = this.document.jackReconnaissanceHand;
    context.agentsCompromised = false;

    context.colors = {
      hearts: {
        icon: '<i class="fa fa-heart"></i>',
        label: game.i18n.localize('HEIST.Global.Suit.Hearts'),
        value: 0,
        isOverflowed: false,
      },
      spades: {
        icon: '<i class="fa fa-spade"></i>',
        label: game.i18n.localize('HEIST.Global.Suit.Spades'),
        value: 0,
        isOverflowed: false,
      },
      diamonds: {
        icon: '<i class="fa fa-diamond"></i>',
        label: game.i18n.localize('HEIST.Global.Suit.Diamonds'),
        value: 0,
        isOverflowed: false,
      },
      clubs: {
        icon: '<i class="fa fa-club"></i>',
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

  async #preparePlanningContext(context) {
    const available = this.document.system.totalAvailableCredits;
    const used = this.document.items.reduce((acc, item) => acc + item.system.cost, 0);

    context.items = this.document.items;
    context.planning = {
      description: await ux.TextEditor.enrichHTML(this.document.system.plan, {
        secrets: this.document.isOwner,
        relativeTo: this.item,
      }),
      credits: {
        available,
        used,
        remaining: available - used,
      },
    };
  }

  async #prepareProgressionContext(context) {
    const options = [];
    const { min, max, step } = this.document.system.schema.fields.progression.fields.budgetAugmentation;

    for (let i = min; i <= max; i += step) {
      options.push({
        label: i,
        value: i,
      });
    }

    const budgetSelect = fields.createSelectInput({
      options,
      value: this.document.system.progression.budgetAugmentation,
      name: 'system.progression.budgetAugmentation',
    });

    context.progression = {
      budgetAugmentations: budgetSelect.outerHTML,
    };
  }

  static async #onAddPlanningItem() {
    const items = await this.actor.createEmbeddedDocuments('Item', [{
      type: 'planning',
      name: game.i18n.localize('HEIST.Global.NewItem'),
    }]);

    items[0].sheet.unlock();
    items[0].sheet.render(true);
  }

  static async #onOpenAgentTest() {
    game[HEIST.SYSTEM_ID].agentTestWindow.render(true);
  }

  static async #onOpenSheet(e) {
    const { id: actorId } = e.target.dataset;
    const actor = game.actors.get(actorId);
    if (!actor?.sheet) {
      return;
    }

    actor.sheet.render(true);
  }

  static async #onAskAgentTest() {
    if (game[HEIST.SYSTEM_ID].agentTestWindow.isRunning) {
      ui.notifications.error(game.i18n.localize('HEIST.Errors.TestAlreadyRunning'));

      return;
    }

    const agents = this.document.system.agents.filter((agent) => !agent?.system.isDead);
    const jackJokers = this.document.system.jackJokers;

    const dataset = await api.DialogV2.input({
      window: { title: game.i18n.localize('HEIST.HeistSheet.AskTest') },
      content: await handlebars.renderTemplate(`systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_heist-ask-test.html.hbs`, {
        agents,
        nextDrawHasJoker: this.document.system.jackNextDrawHasJoker(),
        hasFirstJoker: 0 < jackJokers.length,
        hasSecondJoker: 2 === jackJokers.length,
      }),
      ok: {
        label: game.i18n.localize('HEIST.Global.Validate'),
      },
    });

    if (!dataset.difficulty || !dataset.agentId) {
      ui.notifications.error('Cannot ask a test, missing difficulty and/or agentId!');

      return;
    }

    await game[HEIST.SYSTEM_ID].agentTestWindow.doAgentTest(
      dataset.difficulty,
      this.actor.id,
      dataset.agentId,
      dataset.joker,
    );

    const actor = game.actors.get(dataset.agentId);
    if (actor) {
      await ChatMessage.implementation.create({
        content: `<h3>${game.i18n.format(`HEIST.ChatMessage.${dataset.difficulty.titleCase()}TestAsked`, {
          name: actor.name,
        })}</h3>`,
      });
    }
  }

  static async #onHarmAgent(e) {
    const { agentId } = e.target.dataset;
    const agent = game.actors.get(agentId);
    if (!agent) {
      return;
    }

    await api.DialogV2.confirm({
      window: { title: game.i18n.format('HEIST.HeistSheet.Harm') },
      content: `<h4>${game.i18n.localize('AreYouSure')}</h4>`,
      yes: {
        callback: async () => {
          const count = await agent.system.harm();
          if (null === count) {
            return;
          }

          await ChatMessage.implementation.create({
            content: `<h3>${game.i18n.format('HEIST.ChatMessage.AgentHarmed', {
              count,
              name: agent.name,
            })}</h3>`,
          });

          this.render(false);
        },
      },
    });
  }

  static async #onRescueAgent(e) {
    const { agentId } = e.target.dataset;
    const agent = game.actors.get(agentId);
    if (!agent) {
      return;
    }

    await api.DialogV2.confirm({
      window: { title: game.i18n.format('HEIST.HeistSheet.Rescue') },
      content: `<h4>${game.i18n.localize('AreYouSure')}</h4>`,
      yes: {
        callback: async () => {
          await agent.system.rescue();

          await ChatMessage.implementation.create({
            content: `<h3>${game.i18n.format('HEIST.ChatMessage.AgentRescued', {
              name: agent.name,
            })}</h3>`,
          });

          this.render(false);
        },
      },
    });
  }

  static async #onUseRescue() {
    await this.actor.update({ 'system.progression.rescue': false });
  }

  static async #onKillAgent(e) {
    const { agentId } = e.target.dataset;
    const agent = game.actors.get(agentId);
    if (!agent) {
      return;
    }

    await api.DialogV2.confirm({
      window: { title: game.i18n.format('HEIST.HeistSheet.Kill') },
      content: `<h4>${game.i18n.localize('AreYouSure')}</h4>`,
      yes: {
        callback: async () => {
          await agent.system.kill();

          await ChatMessage.implementation.create({
            content: `<h3>${game.i18n.format('HEIST.ChatMessage.AgentKilled', {
              name: agent.name,
            })}</h3>`,
          });

          this.render(false);
        },
      },
    });
  }

  static async #onRemoveActor(e) {
    const { id: actorId, type } = e.target.dataset;
    const actor = game.actors.get(actorId);
    if (!actor) {
      return;
    }

    await api.DialogV2.confirm({
      window: { title: game.i18n.format('HEIST.HeistSheet.RemoveActor.Title') },
      content: `<h4>${game.i18n.localize('AreYouSure')}</h4>
<p>${game.i18n.format('HEIST.HeistSheet.RemoveActor.Message', { agent: actor.name })}</p>`,
      yes: {
        callback: async () => {
          await this.actor.update({ [`system.${type}`]: null });
          await actor.update({ 'system.agency': null });
        },
      },
    });
  }

  static async #onEditItem(e) {
    const { id: itemId } = e.target.dataset;
    const item = this.actor.items.get(itemId);
    if (!item) {
      return;
    }

    item.sheet.unlock();
    await item.sheet.render(true);
  }

  static async #onRemoveItem(e) {
    const { id: itemId } = e.target.dataset;
    const item = this.actor.items.get(itemId);
    if (!item) {
      return;
    }

    await api.DialogV2.confirm({
      window: { title: game.i18n.format('HEIST.Global.Delete') },
      content: `<p>${game.i18n.localize('AreYouSure')}</p>`,
      yes: {
        callback: () => item.delete(),
      },
    });
  }

  static async #onDrawReconnaissanceCards() {
    let numberCardsOptions = '';

    for (let i = 0; i <= Math.min(5, this.actor.jackDeck?.availableCards.length); i++) {
      numberCardsOptions += `<option value="${i}">${i}</option>`;
    }

    await api.DialogV2.prompt({
      window: { title: game.i18n.localize('HEIST.Global.DrawCards') },
      content: `<p>
  <label for="number-cards">${game.i18n.localize('HEIST.Cards.HowManyToDraw')}</label>
  <select id="number-cards">${numberCardsOptions}</select>
</p>`,
      ok: {
        callback: async (html) => {
          const nbCards = parseInt(html.find('#number-cards')[0]?.value || '0', 10);
          if (0 === nbCards) {
            return;
          }

          await this.actor.jackDrawCards(this.actor.jackReconnaissanceHand, nbCards);

          await ChatMessage.implementation.create({
            content: await handlebars.renderTemplate(`systems/${HEIST.SYSTEM_ID}/templates/chat/cards/few-cards-drawn.html.hbs`, {}),
          });
        },
      },
      rejectClose: false,
    });
  }

  static async #onNextPhase() {
    await api.DialogV2.confirm({
      window: { title: game.i18n.format('HEIST.GamePhaseWindow.Buttons.NextPhase') },
      content: `<h4>${game.i18n.localize('AreYouSure')}</h4>
<p>${game.i18n.format('HEIST.GamePhaseWindow.NextPhaseValidation.Message')}</p>`,
      yes: {
        callback: () => {
          const gamePhase = game[HEIST.SYSTEM_ID].gamePhaseWindow;

          gamePhase.activePreparationPhase();
        },
      },
    });
  }
}

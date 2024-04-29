import * as HEIST from '../../const.mjs';
import { AgentActor } from '../documents/_module.mjs';
import { PlanningItem } from '../../item/documents/_module.mjs';
import { range, transformAsChoices } from '../../helpers/utils.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class HeistActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [HEIST.SYSTEM_ID, 'sheet', 'actor', 'heist-sheet'],
      template: `systems/${HEIST.SYSTEM_ID}/templates/actor/actor-heist-sheet.html.hbs`,
      width: 830,
      height: 935,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'agency' }],
    });
  }

  constructor(object, options = {}) {
    super(object, options);

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

  /**
   * A convenience reference to the Actor document
   * @type {HeistActor}
   */
  get actor() {
    return this.object;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    if (!game.user.isOwner) {
      return;
    }

    html.on('click', '[data-open-sheet]', this.#onOpenSheet.bind(this));
    html.on('click', '[data-add-planning-item]', this.#onAddPlanningItem.bind(this));
    html.on('click', '[data-open-agent-test]', this.#onOpenAgentTest.bind(this));
    html.on('click', '[data-use-rescue]', this.#onUseRescue.bind(this));

    if (!game.user.isGM) {
      return;
    }

    html.on('click', '[data-ask-agent-test]', this.#onAskAgentTest.bind(this));
    html.on('click', '[data-harm-agent]', this.#onHarmAgent.bind(this));
    html.on('click', '[data-rescue-agent]', this.#onRescueAgent.bind(this));
    html.on('click', '[data-kill-agent]', this.#onKillAgent.bind(this));
    html.on('click', '[data-remove-actor]', this.#onRemoveActor.bind(this));
    html.on('click', '[data-edit-item]', this.#onEditItem.bind(this));
    html.on('click', '[data-remove-item]', this.#onRemoveItem.bind(this));
    html.on('click', '[data-draw-reconnaissance]', this.#onDrawReconnaissanceCards.bind(this));
    html.on('click', '[data-next-phase]', this.#onNextPhase.bind(this));
  }

  /** @override */
  async getData() {
    const context = super.getData();
    context.jackAvailableCards = this.actor.jackDeck?.availableCards.length;
    context.canAskTest = game[HEIST.SYSTEM_ID].agentTestWindow.canAskTest;
    context.diamond = this.actor.diamond;
    context.heart = this.actor.heart;
    context.spade = this.actor.spade;
    context.club = this.actor.club;

    context.isGM = game.user.isGM;

    await this.#prepareJokersContext(context);
    await this.#prepareReconnaissanceContext(context);
    await this.#preparePlanningContext(context);
    await this.#prepareProgressionContext(context);

    return context;
  }

  async _onDropActor(event, data) {
    if (!game.user.isGM) {
      return false;
    }

    /** @var Actor actor */
    const actor = await fromUuid(data.uuid);
    if (!actor) {
      return false;
    }

    if (!(actor instanceof AgentActor)) {
      return false;
    }

    const agentType = actor.agentType;
    if (null === agentType || !agentType.system?.type) {
      return false;
    }

    if (null !== actor.agency) {
      ui.notifications.error(game.i18n.localize('HEIST.Errors.AgentAlreadyInAgency'));

      return false;
    }

    await this.actor.update({ [`system.${agentType.system.type}`]: actor.id });

    await actor.update({ 'system.agency': this.actor.id });
  }

  async _onDropItem(event, data) {
    if (!game.user.isGM) {
      return false;
    }

    /** @var Item item */
    const item = await fromUuid(data.uuid);
    if (!item || !(item instanceof PlanningItem)) {
      return false;
    }

    return super._onDropItem(event, data);
  }

  async #onAddPlanningItem(e) {
    e.preventDefault();

    const items = await this.actor.createEmbeddedDocuments('Item', [{
      type: 'planning',
      name: game.i18n.localize('HEIST.Global.NewItem'),
    }]);

    items[0].sheet.isLocked = false;
    items[0].sheet.render(true);
  }

  async #onOpenAgentTest(e) {
    e.preventDefault();

    game[HEIST.SYSTEM_ID].agentTestWindow.render(true);
  }

  async #onOpenSheet(e) {
    e.preventDefault();

    const actorId = e.currentTarget?.dataset?.openSheet;
    if (!actorId) {
      return;
    }

    const actor = game.actors.get(actorId);
    if (!actor || !actor.sheet) {
      return;
    }

    actor.sheet.render(true);
  }

  async #onAskAgentTest(e) {
    e.preventDefault();

    if (game[HEIST.SYSTEM_ID].agentTestWindow.isRunning) {
      ui.notifications.error(game.i18n.localize('HEIST.Errors.TestAlreadyRunning'));

      return;
    }

    const agents = this.actor.agents.filter((agent) => !agent?.isDead);
    const jackJokers = this.actor.jackJokers;

    const dataset = await Dialog.prompt({
      title: game.i18n.localize('HEIST.HeistSheet.AskTest'),
      content: await renderTemplate(`systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_heist-ask-test.html.hbs`, {
        agents,
        nextDrawHasJoker: this.actor.jackNextDrawHasJoker(),
        hasFirstJoker: 0 < jackJokers.length,
        hasSecondJoker: 2 === jackJokers.length,
      }),
      label: game.i18n.localize('HEIST.Global.Validate'),
      callback: async (html) => {
        return {
          agentId: html[0].querySelector('[data-agent]').value,
          difficulty: html[0].querySelector('[data-difficulty]:checked').value,
          joker: parseInt((html[0].querySelector('[data-joker]:checked')?.value || '0'), 10),
        };
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
      await ChatMessage.create({
        content: `<h3>${game.i18n.format(`HEIST.ChatMessage.${dataset.difficulty.titleCase()}TestAsked`, {
          name: actor.name,
        })}</h3>`,
      });
    }
  }

  async #onHarmAgent(e) {
    e.preventDefault();

    const { agentId } = e.currentTarget.dataset;
    if (!agentId) {
      return;
    }

    const agent = game.actors.get(agentId);
    if (!agent) {
      return;
    }

    await Dialog.confirm({
      title: game.i18n.format('HEIST.HeistSheet.Harm'),
      content: `<h4>${game.i18n.localize('AreYouSure')}</h4>`,
      yes: async () => {
        const count = await agent.harm();
        if (null === count) {
          return;
        }

        await ChatMessage.create({
          content: `<h3>${game.i18n.format('HEIST.ChatMessage.AgentHarmed', {
            count,
            name: agent.name,
          })}</h3>`,
        });
      },
    });
  }

  async #onRescueAgent(e) {
    e.preventDefault();

    const { agentId } = e.currentTarget.dataset;
    if (!agentId) {
      return;
    }

    const agent = game.actors.get(agentId);
    if (!agent) {
      return;
    }

    await Dialog.confirm({
      title: game.i18n.format('HEIST.HeistSheet.Rescue'),
      content: `<h4>${game.i18n.localize('AreYouSure')}</h4>`,
      yes: async () => {
        await agent.rescue();

        await ChatMessage.create({
          content: `<h3>${game.i18n.format('HEIST.ChatMessage.AgentRescued', {
            name: agent.name,
          })}</h3>`,
        });
      },
    });
  }

  async #onKillAgent(e) {
    e.preventDefault();

    const { agentId } = e.currentTarget.dataset;
    if (!agentId) {
      return;
    }

    const agent = game.actors.get(agentId);
    if (!agent) {
      return;
    }

    await Dialog.confirm({
      title: game.i18n.format('HEIST.HeistSheet.Kill'),
      content: `<h4>${game.i18n.localize('AreYouSure')}</h4>`,
      yes: async () => {
        await agent.kill();

        await ChatMessage.create({
          content: `<h3>${game.i18n.format('HEIST.ChatMessage.AgentKilled', {
            name: agent.name,
          })}</h3>`,
        });
      },
    });
  }

  async #onRemoveActor(e) {
    e.preventDefault();

    const { id: actorId, type } = e.currentTarget.dataset;
    if (!actorId) {
      return;
    }

    const actor = game.actors.get(actorId);
    if (!actor) {
      return;
    }

    await Dialog.confirm({
      title: game.i18n.format('HEIST.HeistSheet.RemoveActor.Title'),
      content: `<h4>${game.i18n.localize('AreYouSure')}</h4>
<p>${game.i18n.format('HEIST.HeistSheet.RemoveActor.Message', { agent: actor.name })}</p>`,
      yes: this.#removeActor.bind(this, type, actor),
    });
  }

  async #removeActor(type, actor) {
    await this.actor.update({ [`system.${type}`]: null });
    await actor.update({ 'system.agency': null });
  }

  async #onEditItem(e) {
    e.preventDefault();

    const { id: itemId } = e.currentTarget.dataset;
    if (!itemId) {
      return;
    }

    const item = this.actor.items.get(itemId);
    if (!item) {
      return;
    }

    item.sheet.isLocked = false;
    await item.sheet.render(true);
  }

  async #onRemoveItem(e) {
    e.preventDefault();

    const { id: itemId } = e.currentTarget.dataset;
    if (!itemId) {
      return;
    }

    const item = this.actor.items.get(itemId);
    if (!item) {
      return;
    }

    await Dialog.confirm({
      title: game.i18n.format('HEIST.Global.Delete'),
      content: `<p>${game.i18n.localize('AreYouSure')}</p>`,
      yes: () => item.delete(),
    });
  }

  async #onDrawReconnaissanceCards(e) {
    e.preventDefault();

    let numberCardsOptions = '';

    for (let i = 0; i <= Math.min(5, this.actor.jackDeck.availableCards.length); i++) {
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

        await this.actor.jackDrawCards(this.actor.jackReconnaissanceHand, nbCards);

        await ChatMessage.create({
          content: await renderTemplate(`systems/${HEIST.SYSTEM_ID}/templates/chat/cards/few-cards-drawn.html.hbs`, {}),
        });
      },
      rejectClose: false,
    });
  }

  async #onNextPhase(e) {
    e.preventDefault();

    await Dialog.confirm({
      title: game.i18n.format('HEIST.GamePhaseWindow.Buttons.NextPhase'),
      content: `<h4>${game.i18n.localize('AreYouSure')}</h4>
<p>${game.i18n.format('HEIST.GamePhaseWindow.NextPhaseValidation.Message')}</p>`,
      yes: () => {
        const gamePhase = game[HEIST.SYSTEM_ID].gamePhaseWindow;

        gamePhase.activePreparationPhase();
      },
    });
  }

  async #onUseRescue(e) {
    e.preventDefault();

    await this.actor.update({ 'system.progression.rescue': false });
  }

  async #prepareJokersContext(context) {
    const nbPiles = range(0, 10);
    const nbPilesChoices = transformAsChoices(nbPiles);

    const recoJokerNbPiles = range(1, this.actor.system.jack.jokerPhasesConfigurations.reconnaissance.numberOfPile);
    const recoJokerChoices = transformAsChoices(recoJokerNbPiles);

    const actionJokerNbPiles = range(1, this.actor.system.jack.jokerPhasesConfigurations.action.numberOfPile);
    const actionJokerChoices = transformAsChoices(actionJokerNbPiles);

    context.jokers = {
      reconnaissance: {
        nbPiles: nbPilesChoices,
        jokersPiles: recoJokerChoices,
      },
      action: {
        nbPiles: nbPilesChoices,
        jokersPiles: actionJokerChoices,
      },
    };

    return context;
  }

  async #prepareReconnaissanceContext(context) {
    context.canDrawReconnaissance = HEIST.GAME_PHASE_RECONNAISSANCE === game[HEIST.SYSTEM_ID].gamePhaseWindow.currentPhase?.id
      && this.actor.jackCanDraw;
    context.reconnaissanceHand = this.actor.jackReconnaissanceHand;
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
    const available = this.actor.availableCredits;
    const used = context.items.reduce((acc, item) => acc + item.system.cost, 0);

    context.planning = {
      description: await TextEditor.enrichHTML(context.actor.system.plan, { async: true }),
      credits: {
        available,
        used,
        remaining: available - used,
      },
    };
  }

  #prepareProgressionContext(context) {
    const budgetOptions = HandlebarsHelpers.selectOptions(
      transformAsChoices(range(0, 10, 2)),
      {
        hash: {
          selected: context.actor.system.progression.budgetAugmentation,
        },
      },
    );

    context.progression = {
      budgetAugmentations: `<select name="system.progression.budgetAugmentation">${budgetOptions}</select>`,
    };

    return context;
  }
}

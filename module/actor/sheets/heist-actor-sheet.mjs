import * as HEIST from '../../const.mjs';
import { AgentActor, JackActor } from '../documents/_module.mjs';
import { PlanningItem } from '../../item/documents/_module.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class HeistActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [HEIST.SYSTEM_ID, 'sheet', 'actor', 'heist-sheet'],
      width: 830,
      height: 900,
      template: `systems/${HEIST.SYSTEM_ID}/templates/actor/actor-heist-sheet.html.hbs`,
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

    if (!game.user.isGM) {
      return;
    }

    html.on('click', '[data-ask-agent-test]', this.#onAskAgentTest.bind(this));
    html.on('click', '[data-remove-actor]', this.#onRemoveActor.bind(this));
    html.on('click', '[data-edit-item]', this.#onEditItem.bind(this));
    html.on('click', '[data-remove-item]', this.#onRemoveItem.bind(this));
  }

  /** @override */
  async getData() {
    const context = super.getData();
    context.jack = this.actor.jack;
    context.diamond = this.actor.diamond;
    context.heart = this.actor.heart;
    context.spade = this.actor.spade;
    context.club = this.actor.club;

    context.isGM = game.user.isGM;
    context.isOwner = game.user.isOwner;
    context.canTest = game.user.isGM && this.actor.jack?.canAskTest;

    await this.#preparePlanningContext(context);

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

    if (actor instanceof AgentActor) {
      const agentType = actor.agentType;
      if (null === agentType || !agentType.system?.type) {
        return false;
      }

      await this.actor.update({ [`system.${agentType.system.type}`]: actor.id });
    } else if (actor instanceof JackActor) {
      await this.actor.update({ 'system.jack': actor.id });
    }

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

    items[0]?.sheet?.render(true);
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

    const dataset = e.currentTarget.dataset;
    if (!dataset.difficulty || !dataset.agentId) {
      ui.notifications.error('Cannot ask a test, missing difficulty and/or agentId!');

      return;
    }

    await this.actor.jack.doAgentTest(dataset.difficulty, dataset.agentId);

    const actor = game.actors.get(dataset.agentId);
    if (actor) {
      await ChatMessage.create({
        content: `<p>${game.i18n.format(`HEIST.ChatMessage.${dataset.difficulty.titleCase()}TestAsked`, {
          name: actor.name,
        })}</p>`,
      });
    }
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

    const { id: itemId, type } = e.currentTarget.dataset;
    if (!itemId) {
      return;
    }

    const item = this.actor.items.get(itemId);
    if (!item) {
      return;
    }

    await item.sheet.render(true);
  }

  async #onRemoveItem(e) {
    e.preventDefault();

    const { id: itemId, type } = e.currentTarget.dataset;
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

  async #preparePlanningContext(context) {
    const available = game.settings.get(HEIST.SYSTEM_ID, 'availableCreditsOnPlanningPhase');
    const used = context.items.reduce((acc, item) => acc + item.system.cost, 0);
    const remaining = available - used;
    const planningActive = HEIST.GAME_PHASE_PLANNING === game[HEIST.SYSTEM_ID].gamePhaseWindow.currentPhase?.id;

    context.planning = {
      active: planningActive,
      credits: {
        available,
        used,
        remaining,
      },
      canAddItem: planningActive && 0 < remaining,
    };
  }
}

import * as HEIST from '../../const.mjs';
import { AgentActor, JackActor } from '../documents/_module.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class HeistActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [HEIST.SYSTEM_ID, 'sheet', 'actor', 'heist-sheet'],
      width: 1100,
      height: 900,
      template: `systems/${HEIST.SYSTEM_ID}/templates/actor/actor-heist-sheet.html.hbs`,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'agency' }],
    });
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

    if (!game.user.isGM) {
      return;
    }

    html.find('[data-ask-agent-test]').click(this.#onAskAgentTest.bind(this));
    html.find('[data-remove-actor]').click(this.#onRemoveActor.bind(this));
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
    context.canTest = game.user.isGM && this.actor.jack?.deck?.availableCards.length >= 3;

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
  }

  async #onAskAgentTest(e) {
    e.preventDefault();

    const dataset = e.currentTarget.dataset;

    await this.actor.jack.doAgentTest(dataset?.difficulty, dataset?.agentId);
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
      title: game.i18n.format('HEIST.HeistSheet.RemoveAgent.Title'),
      content: `<h4>${game.i18n.localize('AreYouSure')}</h4>
<p>${game.i18n.format('HEIST.HeistSheet.RemoveAgent.Message', { agent: actor.name })}</p>`,
      yes: this.#removeActor.bind(this, type),
    });
  }

  async #removeActor(type) {
    await this.actor.update({ [`system.${type}`]: null });
  }
}

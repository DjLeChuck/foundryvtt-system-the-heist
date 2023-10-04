import * as HEIST from '../../const.mjs';
import { AgentActor, GamemasterActor } from '../documents/_module.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class HeistActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [HEIST.SYSTEM_ID, 'sheet', 'actor', 'heist-sheet'],
      width: 910,
      height: 800,
      template: `systems/${HEIST.SYSTEM_ID}/templates/actor/actor-heist-sheet.html.hbs`,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'agents' }],
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
    html.find('[data-remove-agent]').click(this.#onRemoveAgent.bind(this));
  }

  /** @override */
  async getData() {
    const context = super.getData();
    context.agents = this.actor.agents;

    context.canTest = game.user.isGM && this.actor.gm?.deck?.availableCards.length >= 3;

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
      const agents = new Set(this.actor.system.agents ?? []);
      agents.add(actor.id);

      await this.actor.update({ 'system.agents': Array.from(agents.values()) });
    } else if (actor instanceof GamemasterActor) {
      await this.actor.update({ 'system.gm': actor.id });
    }
  }

  async #onAskAgentTest(e) {
    e.preventDefault();

    const dataset = e.currentTarget.dataset;

    await this.actor.gm.doAgentTest(dataset?.difficulty, dataset?.agentId);
  }

  async #onRemoveAgent(e) {
    e.preventDefault();

    const agentId = e.currentTarget.dataset.id;
    if (!agentId) {
      return;
    }

    const agent = game.actors.get(agentId);
    if (!agent) {
      return;
    }

    await Dialog.confirm({
      title: game.i18n.format('HEIST.GamemasterSheet.RemoveAgent.Title', { agent: agent.name }),
      content: `<h4>${game.i18n.localize('AreYouSure')}</h4>
<p>${game.i18n.format('HEIST.GamemasterSheet.RemoveAgent.Message', { agent: agent.name })}</p>`,
      yes: this.#removeAgent.bind(this, agent),
    });
  }

  async #removeAgent(agent) {
    const agents = new Set(this.actor.system.agents ?? []);

    agents.delete(agent.id);

    await this.actor.update({ 'system.agents': Array.from(agents.values()) });
  }
}

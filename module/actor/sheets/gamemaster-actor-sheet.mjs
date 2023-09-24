import { BaseActorSheet } from './base-actor-sheet.mjs';
import { AgentActor } from '../documents/_module.mjs';

export class GamemasterActorSheet extends BaseActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 910,
      height: 450,
    });
  }

  /**
   * A convenience reference to the Actor document
   * @type {GamemasterActor}
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

    html.find('[data-ask-agent-test]').click(this._onAskAgentTest.bind(this));
  }

  /** @override */
  getData() {
    const context = super.getData();
    context.agents = this.actor.agents;

    context.canTest = this.actor.deck?.availableCards.length >= 3;

    return context;
  }

  async _onDropActor(event, data) {
    if (!this.actor.isOwner) {
      return false;
    }

    /** @var Actor actor */
    const actor = await fromUuid(data.uuid);
    if (!actor || !(actor instanceof AgentActor)) {
      return false;
    }

    const agents = new Set(this.actor.system.agents ?? []);
    agents.add(actor.id);

    await this.actor.update({ 'system.agents': Array.from(agents.values()) });
  }

  async _onAskAgentTest(e) {
    e.preventDefault();

    const dataset = e.currentTarget.dataset;

    await this.actor.doAgentTest(dataset?.difficulty, dataset?.agentId);
  }
}

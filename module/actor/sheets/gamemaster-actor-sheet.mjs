import { BaseActorSheet } from './base-actor-sheet.mjs';
import { AgentActor } from '../documents/_module.mjs';
import * as HEIST from '../../const.mjs';

export class GamemasterActorSheet extends BaseActorSheet {
  constructor(object, options = {}) {
    super(object, options);

    this.changeGamePhaseHook = Hooks.on(
      `${HEIST.SYSTEM_ID}.changeGamePhase`,
      (phase) => this.#onChangeGamePhase(phase),
    );
  }

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      width: 910,
      height: 450,
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'agents' }],
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
    html.find('[data-remove-agent]').click(this._onRemoveAgent.bind(this));
  }

  /** @override */
  getData() {
    const context = super.getData();
    context.agents = this.actor.agents;

    context.canTest = this.actor.deck?.availableCards.length >= 3;
    context.reconnaissanceActive = HEIST.GAME_PHASE_RECONNAISSANCE === game[HEIST.SYSTEM_ID].gamePhaseWindow.currentPhase?.id;

    context.hand = this.actor?.hand;

    return context;
  }

  /** @override */
  async close(options) {
    if (this.changeGamePhaseHook) {
      Hooks.off(`${HEIST.SYSTEM_ID}.changeGamePhase`, this.changeGamePhaseHook);
    }

    return super.close(options);
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

  async _onRemoveAgent(e) {
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

  async #onChangeGamePhase(phase) {
    if (HEIST.GAME_PHASE_RECONNAISSANCE === phase.id) {
      await this.actor.recallDeck();
    }

    this.render(false);
  }
}

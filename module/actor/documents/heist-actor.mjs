import { BaseActor } from './base-actor.mjs';

export class HeistActor extends BaseActor {
  /**
   * @returns {JackActor|null}
   */
  get jack() {
    return game.actors.get(this.system.jack);
  }

  /**
   * @returns {AgentActor[]}
   */
  get agents() {
    const agents = [];

    for (const agentId of this.system.agents) {
      agents.push(game.actors.get(agentId));
    }

    return agents;
  }
}

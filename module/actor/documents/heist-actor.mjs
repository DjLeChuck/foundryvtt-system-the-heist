import { BaseActor } from './base-actor.mjs';

export class HeistActor extends BaseActor {
  /**
   * @returns {GamemasterActor|null}
   */
  get gm() {
    return game.actors.get(this.system.gm);
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

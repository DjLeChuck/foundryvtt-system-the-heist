import { BaseActor } from './base-actor.mjs';

export class HeistActor extends BaseActor {
  /**
   * @returns {JackActor|null}
   */
  get jack() {
    return game.actors.get(this.system.jack);
  }

  /**
   * @returns {AgentActor}
   */
  get spade() {
    return game.actors.get(this.system.spade);
  }

  /**
   * @returns {AgentActor}
   */
  get heart() {
    return game.actors.get(this.system.heart);
  }

  /**
   * @returns {AgentActor}
   */
  get diamond() {
    return game.actors.get(this.system.diamond);
  }

  /**
   * @returns {AgentActor}
   */
  get club() {
    return game.actors.get(this.system.club);
  }
}

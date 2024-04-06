import { BaseActor } from './base-actor.mjs';

export class HeistActor extends BaseActor {
  /**
   * @returns {JackActor|null}
   */
  get jack() {
    if (!this.system.jack) {
      return null;
    }

    return game.actors.get(this.system.jack);
  }

  /**
   * @returns {AgentActor}
   */
  get spade() {
    if (!this.system.spade) {
      return null;
    }

    return game.actors.get(this.system.spade);
  }

  /**
   * @returns {AgentActor}
   */
  get heart() {
    if (!this.system.heart) {
      return null;
    }

    return game.actors.get(this.system.heart);
  }

  /**
   * @returns {AgentActor}
   */
  get diamond() {
    if (!this.system.diamond) {
      return null;
    }

    return game.actors.get(this.system.diamond);
  }

  /**
   * @returns {AgentActor}
   */
  get club() {
    if (!this.system.club) {
      return null;
    }

    return game.actors.get(this.system.club);
  }

  /**
   * @returns {AgentActor[]}
   */
  get agents() {
    return [this.club, this.heart, this.diamond, this.spade].filter(agent => null !== agent);
  }
}

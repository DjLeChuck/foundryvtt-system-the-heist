import { BaseActor } from './base-actor.mjs';

export class CharacterActor extends BaseActor {
  /**
   * Get the actor character class item.
   *
   * @returns {CharacterClassItem|null}
   */
  get characterClass() {
    return this.items.find((item) => 'characterClass' === item.type) ?? null;
  }
}

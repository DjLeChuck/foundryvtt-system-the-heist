import { BasePlayerActor } from './base-player-actor.mjs';
import * as HEIST from '../../const.mjs';

export class AgentActor extends BasePlayerActor {
  /**
   * Get the actor agent type item.
   *
   * @returns {AgentTypeItem|null}
   */
  get agentType() {
    return this.items.find((item) => 'agentType' === item.type) ?? null;
  }

  _baseDeckId() {
    return HEIST.CLUB_DECK_ID;
  }
}

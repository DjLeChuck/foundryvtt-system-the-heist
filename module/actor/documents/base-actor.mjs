import * as HEIST from '../../const.mjs';

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class BaseActor extends Actor {
  constructor(docData, context = {}) {
    if (!context[HEIST.SYSTEM_ID]?.ready) {
      mergeObject(context, { [HEIST.SYSTEM_ID]: { ready: true } });

      const actorConstructor = game.system[HEIST.SYSTEM_ID].actorClasses[docData.type];
      if (actorConstructor) {
        return new actorConstructor(docData, context);
      }
    }

    super(docData, context);
  }
}

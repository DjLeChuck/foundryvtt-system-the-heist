import * as HEIST from '../../const.mjs';

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class BaseItem extends Item {
  static DEFAULT_ICON = `systems/${HEIST.SYSTEM_ID}/images/logos/mini.webp`;

  constructor(docData, context = {}) {
    if (!context[HEIST.SYSTEM_ID]?.ready) {
      foundry.utils.mergeObject(context, { [HEIST.SYSTEM_ID]: { ready: true } });

      const actorConstructor = game.system[HEIST.SYSTEM_ID].itemClasses[docData.type];
      if (actorConstructor) {
        return new actorConstructor(docData, context);
      }
    }

    super(docData, context);
  }
}

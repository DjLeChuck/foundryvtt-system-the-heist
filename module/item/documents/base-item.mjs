import * as HEIST from '../../const.mjs';

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class BaseItem extends Item {
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

  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }
}

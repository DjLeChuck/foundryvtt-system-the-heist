/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class BaseItem extends Item {
  constructor(docData, context = {}) {
    if (!context.heist?.ready) {
      mergeObject(context, { heist: { ready: true } });

      const actorConstructor = game.system.heist.itemClasses[docData.type];
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

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  getRollData() {
    // If present, return the actor's roll data.
    if (!this.actor) {
      return null;
    }
    const rollData = this.actor.getRollData();
    // Grab the item's system data as well.
    rollData.item = foundry.utils.deepClone(this.system);

    return rollData;
  }
}

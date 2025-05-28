import * as HEIST from '../../const.mjs';

export class BaseItemSheet extends foundry.appv1.sheets.ItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [HEIST.SYSTEM_ID, 'sheet', 'item'],
      width: 480,
      height: 720,
    });
  }

  /** @override */
  get template() {
    return `systems/${HEIST.SYSTEM_ID}/templates/item/item-${this.item.type}-sheet.html.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    const context = super.getData();

    const itemData = this.item.toObject(false);

    context.system = itemData.system;

    return context;
  }
}

import * as HEIST from '../../const.mjs';
import LockableSheetMixin from '../../helpers/lockable-sheet-mixin.mjs';

const { api, apps, sheets, ux } = foundry.applications;

export class BaseItemSheet extends LockableSheetMixin(api.HandlebarsApplicationMixin(sheets.ItemSheetV2)) {
  static DEFAULT_OPTIONS = {
    classes: [HEIST.SYSTEM_ID, 'item'],
    position: {
      width: 480,
      height: 720,
    },
    item: {
      type: undefined, // Defined by subclass
    },
    form: {
      submitOnChange: true,
    },
  };

  static PARTS = {
    main: {
      template: undefined,
    },
  };

  static _initializeItemSheetClass() {
    const item = this.DEFAULT_OPTIONS.item;

    this.PARTS = foundry.utils.deepClone(this.PARTS);
    this.PARTS.main.template = `systems/${HEIST.SYSTEM_ID}/templates/item/item-${item.type}-sheet.html.hbs`;

    this.DEFAULT_OPTIONS.classes = [`${item.type}-sheet`];
  }

  async _prepareContext(options) {
    return Object.assign({}, await super._prepareContext(options), {
      systemFields: this.document.system.schema.fields,
    });
  }
}

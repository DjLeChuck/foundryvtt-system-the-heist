import * as HEIST from '../../const.mjs';
import { BaseItemSheet } from './base-item-sheet.mjs';

export default class FetishItemSheet extends BaseItemSheet {
  static DEFAULT_OPTIONS = {
    item: {
      type: 'planning',
    },
  };

  static {
    this._initializeItemSheetClass();

    this.PARTS = foundry.utils.deepClone(this.PARTS);
    this.PARTS.main.templates = [
      `systems/${HEIST.SYSTEM_ID}/templates/item/_partials/_planning-locked-infos.html.hbs`,
      `systems/${HEIST.SYSTEM_ID}/templates/item/_partials/_planning-editable-infos.html.hbs`,
    ];
  }
}

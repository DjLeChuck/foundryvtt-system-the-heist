import { BaseItemSheet } from './_module.mjs';

export default class FetishItemSheet extends BaseItemSheet {
  static DEFAULT_OPTIONS = {
    item: {
      type: 'fetish',
    },
  };

  static {
    this._initializeItemSheetClass();
  }
}

import { BaseItemSheet } from './base-item-sheet.mjs';

const { ux } = foundry.applications;

export default class AgentTypeItemSheet extends BaseItemSheet {
  static DEFAULT_OPTIONS = {
    position: {
      width: 520,
      height: 480,
    },
    item: {
      type: 'agent-type',
    },
  };

  static {
    this._initializeItemSheetClass();
  }

  /** @override */
  async _prepareContext(options) {
    return Object.assign({}, await super._prepareContext(options), {
      enrichedDescription: await ux.TextEditor.implementation.enrichHTML(this.item.system.description, {
        secrets: this.document.isOwner,
        relativeTo: this.item,
      }),
    });
  }
}

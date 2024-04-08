import { BaseItemSheet } from './base-item-sheet.mjs';
import * as HEIST from '../../const.mjs';

export class AgentTypeItemSheet extends BaseItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [HEIST.SYSTEM_ID, 'sheet', 'item', 'agent-type-sheet'],
    });
  }
}

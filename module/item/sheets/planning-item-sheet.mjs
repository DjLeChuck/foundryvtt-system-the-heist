import { BaseItemSheet } from './base-item-sheet.mjs';
import * as HEIST from '../../const.mjs';

export class PlanningItemSheet extends BaseItemSheet {
  isLocked = true;

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [HEIST.SYSTEM_ID, 'sheet', 'item', 'planning-sheet'],
    });
  }

  /** @override */
  getData() {
    const context = super.getData();

    context.isLocked = this.isLocked;

    const costsChoices = this.object.system.schema.fields.cost.choices;
    context.costChoices = costsChoices.reduce((acc, val) => {
      acc[val] = val;
      return acc;
    }, {});

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    if (!this.isEditable) {
      return;
    }

    html.on('click', '[data-lock]', this.#onToggleLock.bind(this));
  }

  #onToggleLock(e) {
    e.preventDefault();

    this.isLocked = !this.isLocked;

    this.render();
  }
}

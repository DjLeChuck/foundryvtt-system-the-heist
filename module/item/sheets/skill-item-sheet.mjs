import { BaseItemSheet } from './base-item-sheet.mjs';
import * as HEIST from '../../const.mjs';

export class SkillItemSheet extends BaseItemSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [HEIST.SYSTEM_ID, 'sheet', 'item', 'skill-sheet'],
      width: 480,
      height: 640,
    });
  }

  /**
   * @type {SkillItem}
   */
  get item() {
    return this.object;
  }

  /** @override */
  async getData() {
    const context = await super.getData();

    context.isLocked = this.item.isLocked;

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

  async #onToggleLock(e) {
    e.preventDefault();

    await this.item.toggleLock();
  }
}

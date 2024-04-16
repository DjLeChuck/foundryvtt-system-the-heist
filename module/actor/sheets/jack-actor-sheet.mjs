import { BaseActorSheet } from './base-actor-sheet.mjs';
import * as HEIST from '../../const.mjs';

export class JackActorSheet extends BaseActorSheet {
  isLocked = true;

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [HEIST.SYSTEM_ID, 'sheet', 'actor', 'jack-sheet'],
      width: 480,
      height: 720,
    });
  }

  /**
   * A convenience reference to the Actor document
   * @type {JackActor}
   */
  get actor() {
    return this.object;
  }

  /** @override */
  getData() {
    const context = super.getData();

    context.isLocked = this.isLocked;

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

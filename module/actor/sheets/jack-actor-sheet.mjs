import { BaseActorSheet } from './base-actor-sheet.mjs';
import * as HEIST from '../../const.mjs';

export class JackActorSheet extends BaseActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [HEIST.SYSTEM_ID, 'sheet', 'actor', 'jack-sheet'],
      width: 910,
      height: 800,
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

    context.deck = this.actor?.deck;

    return context;
  }
}

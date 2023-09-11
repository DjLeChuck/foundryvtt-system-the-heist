import { BaseActorSheet } from './base-actor-sheet.mjs';
import * as HEIST from '../../const.mjs';

export class CharacterActorSheet extends BaseActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'description' }],
    });
  }

  /**
   * A convenience reference to the Actor document
   * @type {CharacterActor}
   */
  get actor() {
    return this.object;
  }

  /** @override */
  async getData() {
    const context = super.getData();

    await this._prepareItems(context);

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    if (!this.isEditable) {
      return;
    }

    html.find('[data-open-compendium]').click(this._onOpenCompendium.bind(this));
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} context The actor to prepare.
   *
   * @return {undefined}
   */
  async _prepareItems(context) {
    let characterClass = null;

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;
      if (i.type === 'characterClass') {
        characterClass = i;
      }
    }

    context.characterClass = characterClass;
  }

  async _onDropSingleItem(itemData) {
    if ('characterClass' === itemData.type && null !== this.actor.characterClass) {
      await this.actor.characterClass.delete();
    }

    return itemData;
  }

  async _onOpenCompendium(event) {
    event.preventDefault();

    const element = event.currentTarget;
    const dataset = element.dataset;

    const compendium = game.packs.find((pack) => `${HEIST.SYSTEM_ID}.${dataset.name}` === pack.metadata.id);
    if (!compendium) {
      ui.notifications.error(game.i18n.format('HEIST.Errors.CompendiumNotFound', { name: dataset.name }));

      return;
    }

    compendium.render(true);
  }
}

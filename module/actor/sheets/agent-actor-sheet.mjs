import { BaseActorSheet } from './base-actor-sheet.mjs';
import * as HEIST from '../../const.mjs';
import { AgentTypeItem } from '../../item/documents/_module.mjs';

export class AgentActorSheet extends BaseActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      tabs: [{ navSelector: '.sheet-tabs', contentSelector: '.sheet-body', initial: 'description' }],
    });
  }

  /**
   * A convenience reference to the Actor document
   * @type {AgentActor}
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
    let agentType = null;

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;
      if (i.type === 'agentType') {
        agentType = i;
      }
    }

    context.agentType = agentType;
  }

  async _onDropSingleItem(itemData) {
    if ('agentType' === itemData.type && null !== this.actor.agentType) {
      await this.actor.agentType.delete();
    }

    return itemData;
  }

  /** @override */
  async _onDropItemCreate(itemData) {
    const items = await super._onDropItemCreate(itemData);

    if (items.length && items[0] instanceof AgentTypeItem) {
      await this.actor.setDecks();
    }

    return items;
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

import { BaseActorSheet } from './base-actor-sheet.mjs';
import * as HEIST from '../../const.mjs';
import { AgentTypeItem } from '../../item/documents/_module.mjs';

export class AgentActorSheet extends BaseActorSheet {
  isLocked = true;

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [HEIST.SYSTEM_ID, 'sheet', 'actor', 'agent-sheet'],
      width: 600,
      height: 935,
    });
  }

  /**
   * @type {AgentActor}
   */
  get actor() {
    return this.object;
  }

  /** @override */
  async getData() {
    const context = super.getData();

    await this._prepareItems(context);

    context.isLocked = this.isLocked;
    context.enrichedDescription = await TextEditor.enrichHTML(context.actor.system.description, { async: true });
    context.remainingCards = this.actor.deck?.availableCards.length;

    return context;
  }

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    if (!this.isEditable) {
      return;
    }

    html.on('click', '[data-open-compendium]', this._onOpenCompendium.bind(this));
    html.on('input', '[data-fetish]', this.#onChangeFetish.bind(this));
    html.on('click', '[data-lock]', this.#onToggleLock.bind(this));
    html.on('click', '[data-agency]', this.#onOpenAgency.bind(this));
    html.on('click', '[data-edit-item]', this.#onEditItem.bind(this));
    html.on('click', '[data-remove-item]', this.#onRemoveItem.bind(this));
    html.on('click', '[data-resurrect]', this.#onResurrect.bind(this));
    html.on('click', '[data-edit-img]', this.#onEditImg.bind(this));
  }

  /**
   * @param {Object} context
   */
  async _prepareItems(context) {
    let agentType = null;
    let fetish = null;
    const skills = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;

      if ('agentType' === i.type) {
        agentType = i;
      }

      if ('fetish' === i.type) {
        fetish = i;
      }

      if ('skill' === i.type) {
        skills.push(i);
      }
    }

    context.agentType = agentType;
    context.fetish = fetish;
    context.skills = skills;
  }

  /**
   * @param {Object} itemData
   * @returns {Promise<Object|boolean>}
   * @private
   */
  async _onDropSingleItem(itemData) {
    if ('agentType' === itemData.type && null !== this.actor.agentType) {
      await this.actor.agentType.delete();
    }

    if ('fetish' === itemData.type && null !== this.actor.fetish) {
      await this.actor.fetish.delete();
    }

    if ('skill' === itemData.type && !this.actor.canLearnSkill) {
      ui.notifications.error(game.i18n.localize('HEIST.Errors.AlreadyMaxSkills'));

      return false;
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

  async #onChangeFetish(e) {
    e.preventDefault();

    await this.actor.toggleFetish();
  }

  #onToggleLock(e) {
    e.preventDefault();

    this.isLocked = !this.isLocked;

    this.render();
  }

  #onOpenAgency(e) {
    e.preventDefault();

    if (null === this.actor.agency) {
      return;
    }

    this.actor.agency.sheet.render(true);
  }

  #onEditItem(e) {
    e.preventDefault();

    const item = this.actor.items.get(e.currentTarget.dataset.id);
    if (!item) {
      ui.notifications.error(game.i18n.localize('HEIST.Errors.ItemNotFound'));

      return;
    }

    item.sheet.isLocked = false;
    item.sheet.render(true);
  }

  async #onRemoveItem(e) {
    e.preventDefault();

    const item = this.actor.items.get(e.currentTarget.dataset.id);
    if (!item) {
      ui.notifications.error(game.i18n.localize('HEIST.Errors.ItemNotFound'));

      return;
    }

    await Dialog.confirm({
      title: game.i18n.localize('AreYouSure'),
      content: `<h4>${game.i18n.format('HEIST.Global.DeleteItem', { name: item.name })}</h4>`,
      yes: async () => {
        await item.delete();
      },
    });
  }

  async #onResurrect(e) {
    e.preventDefault();

    await Dialog.confirm({
      title: game.i18n.localize('AreYouSure'),
      content: `<h4>${game.i18n.localize('HEIST.Agent.ConfirmResurrect')}</h4>`,
      yes: async () => {
        await this.actor.resurrect();
      },
    });
  }

  async #onEditImg(e) {
    e.preventDefault();

    const current = foundry.utils.getProperty(this.object, 'img');
    const { img } = this.document.constructor.getDefaultArtwork?.(this.document.toObject()) ?? {};
    const fp = new FilePicker({
      current,
      type: 'image',
      redirectToRoot: img ? [img] : [],
      callback: (path) => {
        this.object.update({ 'img': path });
      },
      top: this.position.top + 40,
      left: this.position.left + 10,
    });

    return fp.browse();
  }
}

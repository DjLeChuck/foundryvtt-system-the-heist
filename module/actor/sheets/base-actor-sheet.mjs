/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class BaseActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ['the-heist', 'sheet', 'actor'],
      template: 'systems/the-heist/templates/actor/actor-sheet.html.hbs',
      width: 750,
      height: 690,
    });
  }

  /** @override */
  get template() {
    return `systems/the-heist/templates/actor/actor-${this.actor.type}-sheet.html.hbs`;
  }

  /**
   * A convenience reference to the Actor document
   * @type {BaseActor}
   */
  get actor() {
    return this.object;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.toObject(false);

    context.system = actorData.system;

    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) {
      return;
    }

    html.find('.item-create').click(this._onItemCreate.bind(this));

    new ContextMenu(html, '.item.card', [], { onOpen: this._onItemContext.bind(this) });

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains('inventory-header')) {
          return;
        }

        li.setAttribute('draggable', true);
        li.addEventListener('dragstart', handler, false);
      });
    }
  }

  /** @override */
  async _onDropItemCreate(itemData) {
    let items = itemData instanceof Array ? itemData : [itemData];
    const toCreate = [];
    for (const item of items) {
      const result = await this._onDropSingleItem(item);

      if (result) {
        toCreate.push(result);
      }
    }

    // Create the owned items as normal
    return this.actor.createEmbeddedDocuments('Item', toCreate);
  }

  /* -------------------------------------------- */

  /**
   * Handles dropping of a single item onto this character sheet.
   * @param {object} itemData            The item data to create.
   * @returns {Promise<object|boolean>}  The item data to create after processing, or false if the item should not be
   *                                     created or creation has been otherwise handled.
   * @protected
   */
  async _onDropSingleItem(itemData) {
    return itemData;
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: data,
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.system['type'];

    // Finally, create the item!
    return await Item.create(itemData, { parent: this.actor });
  }

  _onItemContext(element) {
    const item = this.actor.items.get(element.dataset.id);
    if (!item) {
      return;
    }

    ui.context.menuItems = [{
      icon: '<i class="fas fa-edit"></i>',
      name: 'HEIST.Global.Edit',
      callback: () => item.sheet.render(true),
    }, {
      icon: '<i class="fas fa-trash"></i>',
      name: 'HEIST.Global.Delete',
      callback: () => item.deleteDialog(),
    }];
  }
}

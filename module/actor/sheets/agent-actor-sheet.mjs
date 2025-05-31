import * as HEIST from '../../const.mjs';
import LockableSheetMixin from '../../helpers/lockable-sheet-mixin.mjs';

const { api, apps, sheets, ux } = foundry.applications;

export default class AgentActorSheet extends LockableSheetMixin(api.HandlebarsApplicationMixin(sheets.ActorSheetV2)) {
  static DEFAULT_OPTIONS = {
    classes: [HEIST.SYSTEM_ID, 'actor', 'agent-sheet'],
    position: {
      width: 600,
      height: 935,
    },
    actions: {
      openAgency: AgentActorSheet.#onOpenAgency,
      editDocumentImage: AgentActorSheet.#onEditDocumentImage,
      resurrect: AgentActorSheet.#onResurrect,
      editItem: AgentActorSheet.#onEditItem,
      deleteItem: AgentActorSheet.#onDeleteItem,
    },
    form: {
      submitOnChange: true,
    },
  };

  static PARTS = {
    main: {
      template: `systems/${HEIST.SYSTEM_ID}/templates/actor/actor-agent-sheet.html.hbs`,
      templates: [
        `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_agent-skills.html.hbs`,
        `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_agent-editable-skills.html.hbs`,
        `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_agent-fetish.html.hbs`,
        `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_agent-editable-fetish.html.hbs`,
      ],
    },
  };

  /** @override */
  async _prepareContext(options) {
    return Object.assign({}, await super._prepareContext(options), {
      actor: this.document,
      system: this.document.system,
      systemFields: this.document.system.schema.fields,
      enrichedDescription: await ux.TextEditor.implementation.enrichHTML(this.actor.system.description, {
        secrets: this.document.isOwner,
        relativeTo: this.actor,
      }),
      hasDeck: null !== this.actor.deckDocument,
      remainingCards: this.actor.deckDocument?.availableCards.length,
      ...this.#prepareItems(),
    });
  }

  /**
   * @param {DragEvent} event
   * @param {HeistItem} item
   */
  async _onDropItem(event, item) {
    if ('planning' === item.type) {
      return;
    }

    if ('agentType' === item.type && null !== this.actor.system.agentType) {
      if (!game.users.activeGM) {
        ui.notifications.error(game.i18n.localize('HEIST.Errors.ChangeAgentTypeRequireActiveGM'));

        return;
      }

      await this.actor.system.agentType.delete();
    }

    if ('fetish' === item.type && null !== this.actor.system.fetish) {
      await this.actor.system.fetish.delete();
    }

    if ('skill' === item.type && !this.actor.system.canLearnSkill) {
      ui.notifications.error(game.i18n.localize('HEIST.Errors.AlreadyMaxSkills'));

      return;
    }

    await super._onDropItem(event, item);

    if ('agentType' === item.type) {
      if (game.user.isGM) {
        await this.actor.setDecks();
      } else {
        game.socket.emit(`system.${HEIST.SYSTEM_ID}`, {
          request: HEIST.SOCKET_REQUESTS.GM_HANDLE_SET_DECKS,
          actor: this.actor.id,
        });
      }
    }
  }

  #prepareItems() {
    let agentType = null;
    let fetish = null;
    const skills = [];

    for (let i of this.document.items) {
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

    return {
      agentType,
      fetish,
      skills,
    };
  }

  static #onOpenAgency() {
    if (null === this.actor.agencyDocument) {
      return;
    }

    this.actor.agencyDocument.sheet.render(true);
  }

  static async #onEditDocumentImage() {
    const current = foundry.utils.getProperty(this.document._source, 'img');
    const defaultArtwork = this.document.constructor.getDefaultArtwork?.(this.document._source) ?? {};
    const defaultImage = foundry.utils.getProperty(defaultArtwork, 'img');
    const fp = new apps.FilePicker.implementation({
      current,
      type: 'image',
      redirectToRoot: defaultImage ? [defaultImage] : [],
      callback: (path) => {
        this.document.update({ 'img': path });
      },
      position: {
        top: this.position.top + 40,
        left: this.position.left + 10,
      },
    });
    await fp.browse();
  }

  static async #onResurrect() {
    await api.DialogV2.confirm({
      window: {
        title: game.i18n.localize('AreYouSure'),
        icon: 'fa fa-tombstone',
      },
      content: `<h4>${game.i18n.localize('HEIST.Agent.ConfirmResurrect')}</h4>`,
      yes: {
        callback: async () => await this.actor.resurrect(),
      },
    });
  }

  static #onEditItem(e) {
    const item = this.actor.items.get(e.target.dataset.id);
    if (!item) {
      ui.notifications.error(game.i18n.localize('HEIST.Errors.ItemNotFound'));

      return;
    }

    item.sheet.unlock();
    item.sheet.render(true);
  }

  static async #onDeleteItem(e) {
    const item = this.actor.items.get(e.target.dataset.id);
    if (!item) {
      ui.notifications.error(game.i18n.localize('HEIST.Errors.ItemNotFound'));

      return;
    }

    await api.DialogV2.confirm({
      title: game.i18n.localize('AreYouSure'),
      content: `<h4>${game.i18n.format('HEIST.Global.DeleteItem', { name: item.name })}</h4>`,
      yes: {
        callback: async () => await item.delete(),
      },
    });
  }
}

import * as HEIST from '../../const.mjs';

const { api, apps, sheets, ux } = foundry.applications;

export default class AgentActorSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
  #isLocked = true;

  static DEFAULT_OPTIONS = {
    classes: [HEIST.SYSTEM_ID, 'actor', 'agent-sheet'],
    position: {
      width: 600,
      height: 935,
    },
    actions: {
      toggleLock: AgentActorSheet.#onToggleLock,
      openAgency: AgentActorSheet.#onOpenAgency,
      editDocumentImage: AgentActorSheet.#onEditDocumentImage,
      resurrect: AgentActorSheet.#onResurrect,
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
      isLocked: this.#isLocked,
      enrichedDescription: await ux.TextEditor.implementation.enrichHTML(this.actor.system.description, {
        secrets: this.document.isOwner,
        relativeTo: this.actor,
      }),
      hasDeck: null !== this.actor.deck,
      remainingCards: this.actor.deck?.availableCards.length,
      ...this.#prepareItems(),
    });
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

  static #onToggleLock() {
    this.#isLocked = !this.#isLocked;

    this.render();
  }

  static #onOpenAgency() {
    if (null === this.actor.agency) {
      return;
    }

    this.actor.agency.sheet.render(true);
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
        callback: async () => {
          await this.actor.resurrect();
        },
      },
    });
  }
}

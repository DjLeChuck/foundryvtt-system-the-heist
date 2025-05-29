import * as HEIST from '../../const.mjs';

const { api, apps, sheets, ux } = foundry.applications;

export default class NpcActorSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: [HEIST.SYSTEM_ID, 'actor', 'npc-sheet'],
    position: {
      width: 700,
      height: 500,
    },
    form: {
      submitOnChange: true,
    },
  };

  static PARTS = {
    main: {
      template: `systems/${HEIST.SYSTEM_ID}/templates/actor/npc-agent-sheet.html.hbs`,
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
    });
  }
}

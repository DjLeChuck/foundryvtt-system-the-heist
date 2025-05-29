import * as HEIST from '../../const.mjs';

export class NpcActorSheet extends foundry.appv1.sheets.ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: [HEIST.SYSTEM_ID, 'sheet', 'actor', 'npc-sheet'],
      template: `systems/${HEIST.SYSTEM_ID}/templates/actor/npc-agent-sheet.html.hbs`,
      width: 700,
      height: 500,
    });
  }

  /**
   * @type {NpcActor}
   */
  get actor() {
    return this.object;
  }

  /** @override */
  async getData() {
    const context = super.getData();

    context.enrichedDescription = await TextEditor.enrichHTML(context.actor.system.description, { async: true });

    return context;
  }
}

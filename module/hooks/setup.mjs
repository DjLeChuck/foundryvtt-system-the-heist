import * as HEIST from '../const.mjs';
import * as actor from '../actor/_module.mjs';
import * as item from '../item/_module.mjs';

export const Setup = {
  listen() {
    Hooks.once('setup', () => {
      // Register sheets
      const sheets = foundry.applications.apps.DocumentSheetConfig;
      sheets.unregisterSheet(Actor, 'core', foundry.appv1.sheets.ActorSheet);
      sheets.registerSheet(Actor, HEIST.SYSTEM_ID, actor.sheets.AgentActorSheet, {
        types: ['agent'],
        makeDefault: true,
      });
      sheets.registerSheet(Actor, HEIST.SYSTEM_ID, actor.sheets.NpcActorSheet, {
        types: ['npc'],
        makeDefault: true,
      });
      // heist
      sheets.unregisterSheet(Item, 'core', foundry.appv1.sheets.ItemSheet);
      sheets.registerSheet(Item, HEIST.SYSTEM_ID, item.sheets.AgentTypeItemSheet, {
        types: ['agentType'],
        makeDefault: true,
      });sheets.registerSheet(Item, HEIST.SYSTEM_ID, item.sheets.FetishItemSheet, {
        types: ['fetish'],
        makeDefault: true,
      });
      sheets.registerSheet(Item, HEIST.SYSTEM_ID, item.sheets.PlanningItemSheet, {
        types: ['planning'],
        makeDefault: true,
      });
      sheets.registerSheet(Item, HEIST.SYSTEM_ID, item.sheets.SkillItemSheet, {
        types: ['skill'],
        makeDefault: true,
      });

      foundry.documents.collections.Actors.registerSheet(HEIST.SYSTEM_ID, actor.sheets.HeistActorSheet, {
        types: ['heist'],
        makeDefault: true,
      });
    });
  },
};

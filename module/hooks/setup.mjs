import * as HEIST from '../const.mjs';
import * as actor from '../actor/_module.mjs';
import * as item from '../item/_module.mjs';

export const Setup = {
  listen() {
    Hooks.once('setup', () => {
      // Register sheets
      Actors.unregisterSheet('core', ActorSheet);
      Actors.registerSheet(HEIST.SYSTEM_ID, actor.sheets.AgentActorSheet, {
        types: ['agent'],
        makeDefault: true,
      });
      Actors.registerSheet(HEIST.SYSTEM_ID, actor.sheets.JackActorSheet, {
        types: ['jack'],
        makeDefault: true,
      });
      Actors.registerSheet(HEIST.SYSTEM_ID, actor.sheets.HeistActorSheet, {
        types: ['heist'],
        makeDefault: true,
      });
      Items.unregisterSheet('core', ItemSheet);
      Items.registerSheet(HEIST.SYSTEM_ID, item.sheets.AgentTypeItemSheet, {
        types: ['agentType'],
        makeDefault: true,
      });
      Items.registerSheet(HEIST.SYSTEM_ID, item.sheets.FetishItemSheet, {
        types: ['fetish'],
        makeDefault: true,
      });
      Items.registerSheet(HEIST.SYSTEM_ID, item.sheets.PlanningItemSheet, {
        types: ['planning'],
        makeDefault: true,
      });
      Items.registerSheet(HEIST.SYSTEM_ID, item.sheets.SkillItemSheet, {
        types: ['skill'],
        makeDefault: true,
      });
    });
  },
};

import { autoRegisterBabel, registerSettings } from '../system/settings.mjs';
import { registerTemplates } from '../helpers/templates.mjs';
import { registerHandlebarsHelper } from '../helpers/handlebars.mjs';
import * as HEIST from '../const.mjs';
import * as app from '../app/_module.mjs';
import * as actor from '../actor/_module.mjs';
import * as item from '../item/_module.mjs';

export const Init = {
  listen() {
    Hooks.on('init', () => {
      console.log('The Heist | Initializing System');

      // Register actors and items classes
      game.system[HEIST.SYSTEM_ID] = {
        actorClasses: {
          agent: actor.documents.AgentActor,
          jack: actor.documents.JackActor,
          heist: actor.documents.HeistActor,
        },
        itemClasses: {
          agentType: item.documents.AgentTypeItem,
          fetish: item.documents.FetishItem,
          planning: item.documents.PlanningItem,
          skill: item.documents.SkillItem,
        },
      };

      registerHandlebarsHelper();
      registerSettings();
      registerTemplates();

      if (typeof Babele !== 'undefined') {
        if (game.settings.get(HEIST.SYSTEM_ID, 'autoRegisterBabel')) {
          autoRegisterBabel();
        }
      }

      // Add utility classes to the global game object so that they're more easily
      // accessible in global contexts.
      game[HEIST.SYSTEM_ID] = {
        rollItemMacro,
        agentTestWindow: new app.windows.AgentTestWindow(),
        gamePhaseWindow: new app.windows.GamePhaseWindow(),
      };
    });
  },
};

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then(item => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(`Could not find item ${itemName}. You may need to delete and recreate this macro.`);
    }

    // Trigger the item roll
    item.roll();
  });
}

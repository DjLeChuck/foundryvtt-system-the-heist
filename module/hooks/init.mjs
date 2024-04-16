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
        agentTestWindow: new app.windows.AgentTestWindow(),
        gamePhaseWindow: new app.windows.GamePhaseWindow(),
      };
    });
  },
};

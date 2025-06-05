import { registerSettings } from '../system/settings.mjs';
import { registerTemplates } from '../helpers/templates.mjs';
import { registerHandlebarsHelper } from '../helpers/handlebars.mjs';
import * as HEIST from '../const.mjs';
import * as app from '../app/_module.mjs';
import { Tools } from '../helpers/tools.mjs';

export const Init = {
  listen() {
    Hooks.on('init', () => {
      console.log('The Heist | Initializing System');

      registerHandlebarsHelper();
      registerSettings();
      registerTemplates();

      if (game.settings.get(HEIST.SYSTEM_ID, 'autoRegisterBabel')) {
        Hooks.once('babele.init', (babele) => {
          babele.setSystemTranslationsDir('lang/packs/translations');
        });
      }

      // Add utility classes to the global game object so that they're more easily
      // accessible in global contexts.
      game[HEIST.SYSTEM_ID] = {
        agentTestWindow: new app.windows.AgentTestWindow(),
        gamePhaseWindow: new app.windows.GamePhaseWindow(),
        tools: new Tools(),
      };
    });
  },
};

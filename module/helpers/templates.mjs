import * as HEIST from '../const.mjs';

/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 */
export const registerTemplates = function () {
  loadTemplates([
    // Gamemaster
    `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_gamemaster-agents.html.hbs`,
    `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_gamemaster-reconnaissance.html.hbs`,

    // Card Window
    `systems/${HEIST.SYSTEM_ID}/templates/app/_partials/_card-window-test-running.html.hbs`,
    `systems/${HEIST.SYSTEM_ID}/templates/app/_partials/_card-window-no-test.html.hbs`,
  ]);
};

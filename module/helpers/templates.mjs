import * as HEIST from '../const.mjs';

/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 */
export const registerTemplates = function () {
  loadTemplates([
    // Gamemaster actor
    `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_gamemaster-reconnaissance.html.hbs`,

    // The Heist actor
    `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_heist-agents.html.hbs`,
    `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_heist-planning.html.hbs`,

    // Agent Test Window
    `systems/${HEIST.SYSTEM_ID}/templates/app/_partials/_agent-test-window-test-running.html.hbs`,
    `systems/${HEIST.SYSTEM_ID}/templates/app/_partials/_agent-test-window-no-test.html.hbs`,
  ]);
};

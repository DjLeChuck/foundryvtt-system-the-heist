import * as HEIST from '../const.mjs';

/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 */
export const registerTemplates = function () {
  foundry.applications.handlebars.loadTemplates([
    // Agent Test Window
    `systems/${HEIST.SYSTEM_ID}/templates/app/_partials/_agent-test-window-test-running.html.hbs`,
    `systems/${HEIST.SYSTEM_ID}/templates/app/_partials/_agent-test-window-no-test.html.hbs`,

    // Chat
    `systems/${HEIST.SYSTEM_ID}/templates/chat/agent-test/success.html.hbs`,
  ]);
};

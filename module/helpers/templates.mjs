import * as HEIST from '../const.mjs';

/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 */
export const registerTemplates = function () {
  loadTemplates([
    // Agent actor
    `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_agent-editable-skills.html.hbs`,
    `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_agent-skills.html.hbs`,
    `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_agent-editable-fetish.html.hbs`,
    `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_agent-fetish.html.hbs`,

    // The Heist actor
    `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_heist-jokers.html.hbs`,
    `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_heist-agency.html.hbs`,
    `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_heist-agent.html.hbs`,
    `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_heist-jack.html.hbs`,
    `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_heist-reconnaissance.html.hbs`,
    `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_heist-planning.html.hbs`,
    `systems/${HEIST.SYSTEM_ID}/templates/actor/_partials/_heist-progression.html.hbs`,

    // Agent Test Window
    `systems/${HEIST.SYSTEM_ID}/templates/app/_partials/_agent-test-window-test-running.html.hbs`,
    `systems/${HEIST.SYSTEM_ID}/templates/app/_partials/_agent-test-window-no-test.html.hbs`,

    // Chat
    `systems/${HEIST.SYSTEM_ID}/templates/chat/agent-test/success.html.hbs`,

    // Planning item
    `systems/${HEIST.SYSTEM_ID}/templates/item/_partials/_planning-locked-infos.html.hbs`,
    `systems/${HEIST.SYSTEM_ID}/templates/item/_partials/_planning-editable-infos.html.hbs`,
  ]);
};

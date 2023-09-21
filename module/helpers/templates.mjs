/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 */
export const registerTemplates = function () {
  loadTemplates([
    // Card Window
    'systems/heist/templates/app/_partials/_card-window-test-running.html.hbs',
    'systems/heist/templates/app/_partials/_card-window-no-test.html.hbs',
  ]);
};

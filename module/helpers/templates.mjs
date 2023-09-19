/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([
    // Card Window
    'systems/heist/templates/app/_partials/_card-window-test-running.html.hbs',
    'systems/heist/templates/app/_partials/_card-window-no-test.html.hbs',
  ]);
};

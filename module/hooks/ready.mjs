import * as HEIST from '../const.mjs';
import { SocketListener } from '../socket-listener.mjs';

export const Ready = {
  listen() {
    Hooks.once('ready', async function () {
      // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
      Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));

      if (
        (game.user.isGM || game.settings.get(HEIST.SYSTEM_ID, 'allowAgentsToSeeGamePhaseTimer'))
        && game.settings.get(HEIST.SYSTEM_ID, 'displayGamePhaseWindowOnLogin')
      ) {
        game[HEIST.SYSTEM_ID].gamePhaseWindow.render(true);
      }

      if (!game.settings.get(HEIST.SYSTEM_ID, 'systemHowToShown')) {
        game.settings.set(HEIST.SYSTEM_ID, 'systemHowToShown', true);

        const howto = await game.packs.get('heist.system-presentation').getDocument('SystemHowTo00000');
        howto.sheet.render(true);
      }

      SocketListener.activate();
    });
  },
};

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== 'Item') {
    return;
  }

  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn('You can only create macro buttons for owned Items');
  }

  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.${HEIST.SYSTEM_ID}.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.implementation.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { [`${HEIST.SYSTEM_ID}.itemMacro`]: true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);

  return false;
}

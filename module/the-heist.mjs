import * as actor from './actor/_module.mjs';
import * as item from './item/_module.mjs';
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function () {
  game.settings.register('heist', 'autoRegisterBabel', {
    name: 'HEIST.Settings.AutoRegisterBabele.Title',
    hint: 'HEIST.Settings.AutoRegisterBabele.Hint',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean,
    onChange: value => {
      if (value) {
        autoRegisterBabel();
      }

      window.location.reload();
    },
  });

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.heist = {
    rollItemMacro,
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = actor.documents.BaseActor;
  CONFIG.Item.documentClass = item.documents.BaseItem;

  game.system.heist = {
    actorClasses: {
      character: actor.documents.CharacterActor,
    },
    itemClasses: {
      characterClass: item.documents.CharacterClassItem,
      skill: item.documents.SkillItem,
    },
  };

  // Register custom Data Model
  CONFIG.Actor.dataModels.character = actor.models.CharacterDataModel;
  CONFIG.Item.dataModels.characterClass = item.models.CharacterClassDataModel;
  CONFIG.Item.dataModels.skill = item.models.SkillDataModel;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('heist', actor.sheets.CharacterActorSheet, {
    types: ['character'],
    makeDefault: true,
  });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('heist', item.sheets.CharacterClassItemSheet, {
    types: ['characterClass'],
    makeDefault: true,
  });
  Items.registerSheet('heist', item.sheets.SkillItemSheet, {
    types: ['skill'],
    makeDefault: true,
  });

  if (typeof Babele !== 'undefined') {
    if (game.settings.get('heist', 'autoRegisterBabel')) {
      autoRegisterBabel();
    }
  }

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

function autoRegisterBabel() {
  if (typeof Babele !== 'undefined') {
    Babele.get().setSystemTranslationsDir('packs/translations');
  }
}

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', async function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */

/* -------------------------------------------- */

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
  const command = `game.heist.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'heist.itemMacro': true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);

  return false;
}

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

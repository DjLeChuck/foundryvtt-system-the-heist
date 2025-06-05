import * as HEIST from '../const.mjs';
import * as app from '../app/_module.mjs';

export function registerSettings() {
  game.settings.register(HEIST.SYSTEM_ID, 'systemHowToShown', {
    scope: 'world',
    config: false,
    default: false,
    type: Boolean,
  });

  game.settings.register(HEIST.SYSTEM_ID, 'autoRegisterBabel', {
    name: 'HEIST.Settings.AutoRegisterBabele.Title',
    hint: 'HEIST.Settings.AutoRegisterBabele.Hint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true,
  });

  game.settings.register(HEIST.SYSTEM_ID, 'currentTest', {
    scope: 'world',
    config: false,
    type: app.models.CurrentTestDataModel,
    default: {},
  });

  game.settings.register(HEIST.SYSTEM_ID, 'gamePhase', {
    scope: 'world',
    config: false,
    type: app.models.GamePhaseDataModel,
    default: {},
  });

  game.settings.register(HEIST.SYSTEM_ID, 'displayGamePhaseWindowOnLogin', {
    name: 'HEIST.Settings.DisplayGamePhaseWindowOnLogin.Title',
    scope: 'client',
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true,
  });

  game.settings.register(HEIST.SYSTEM_ID, 'smallGamePhaseWindow', {
    name: 'HEIST.Settings.SmallGamePhaseWindow.Title',
    hint: 'HEIST.Settings.SmallGamePhaseWindow.Hint',
    scope: 'client',
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true,
  });

  game.settings.register(HEIST.SYSTEM_ID, 'useGamePauseForPhaseTimeLeft', {
    name: 'HEIST.Settings.UseGamePauseForPhaseTimeLeft.Title',
    hint: 'HEIST.Settings.UseGamePauseForPhaseTimeLeft.Hint',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true,
  });

  game.settings.register(HEIST.SYSTEM_ID, 'allowAgentsToSeeGamePhaseTimer', {
    name: 'HEIST.Settings.AllowAgentsToSeeGamePhaseTimer.Title',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean,
    requiresReload: true,
  });

  for (const phase of HEIST.GAME_PHASES) {
    game.settings.register(HEIST.SYSTEM_ID, `phase${phase.number}Duration`, {
      name: `HEIST.Settings.Phase${phase.number}Duration.Title`,
      hint: `HEIST.Settings.Phase${phase.number}Duration.Hint`,
      scope: 'world',
      config: true,
      default: phase.defaultDuration,
      type: Number,
      requiresReload: true,
    });
  }
}

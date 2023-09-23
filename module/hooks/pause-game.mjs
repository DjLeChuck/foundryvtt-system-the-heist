import * as HEIST from '../const.mjs';

export const PauseGame = {
  listen() {
    Hooks.on('pauseGame', (paused) => {
      if (game.user.isGM && game.settings.get(HEIST.SYSTEM_ID, 'useGamePauseForPhaseTimeLeft')) {
        game[HEIST.SYSTEM_ID].gamePhaseWindow.setPauseState(paused);
      }
    });
  },
};
